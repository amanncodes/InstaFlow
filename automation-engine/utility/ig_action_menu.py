"""
InstaFlow  Instagram Action Control Menu
=========================================

Purpose:
--------
Provides a text-based CLI for operators to manually trigger
human-like Instagram actions using the existing automation stack.

Features:
---------
- Loads logged-in SocialAccount from Django DB
- Reuses InstagramBot + BaseBot helpers
- Emits rich events to backend timeline
- Logs step-by-step execution to terminal
- Uses cookies/session (no credentials hardcoded)
- Clean browser shutdown on exit

Usage:
------
cd e:/InstaFlow/automation-engine
python utility/ig_action_menu.py
"""

from __future__ import annotations

import os
import sys
import time
import random
import traceback
import re
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Callable, List, Tuple

from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

try:
    import typer  # type: ignore
    TYPER_AVAILABLE = True
except Exception:
    TYPER_AVAILABLE = False

try:
    from textual.app import App, ComposeResult
    from textual.widgets import Header, Footer, ListView, ListItem, Label, RichLog, Static
    from textual import work
    TEXTUAL_AVAILABLE = True
except Exception:
    TEXTUAL_AVAILABLE = False

# ------------------------------------------------------------------
# Django bootstrap
# ------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parents[2]
LOGIN_BOT_DIR = REPO_ROOT / "automation-engine" / "login-bot"
APP_DIR = REPO_ROOT / "automation-engine" / "app"
AUTO_ENGINE_DIR = REPO_ROOT / "automation-engine"

sys.path.insert(0, str(LOGIN_BOT_DIR))
# Ensure "app" package is importable as a top-level module
sys.path.insert(0, str(AUTO_ENGINE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")

import django  # noqa: E402

django.setup()

from bots.models import SocialAccount  # noqa: E402
from bots.platforms.instagram import InstagramBot  # noqa: E402
from app.integrations.backend import emit_event  # noqa: E402

# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

BASE_URL = "https://www.instagram.com/"

DATA_DIR = Path(__file__).resolve().parent
SAFE_COMMENTS_FILE = DATA_DIR / "ig_safe_comments.txt"
DM_TARGETS_FILE = DATA_DIR / "ig_dm_targets.txt"
DM_MESSAGES_FILE = DATA_DIR / "ig_dm_messages.txt"

DEFAULT_SCROLL_MIN_S = 30
DEFAULT_SCROLL_MAX_RANGE_S = (120, 300)

COMMENT_SECTION_OPEN_CHANCE = 0.08
AUTO_COMMENT_AFTER_OPEN_CHANCE = 0.03
RANDOM_LIKE_CHANCE = 0.2

USERNAME_RE = re.compile(r"^[A-Za-z0-9._]{1,30}$")


LOG_SINK: Optional[Callable[[str], None]] = None


def log(msg: str, level: str = "INFO") -> None:
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] [{level}] {msg}"
    print(line)
    if LOG_SINK:
        LOG_SINK(line)


def human_pause(min_s: float = 1.2, max_s: float = 3.5) -> None:
    time.sleep(random.uniform(min_s, max_s))


def require_input(prompt: str) -> Optional[str]:
    try:
        value = input(prompt).strip()
        return value if value else None
    except KeyboardInterrupt:
        print()
        return None


def load_lines(path: Path) -> List[str]:
    if not path.exists():
        return []
    lines: List[str] = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        lines.append(line)
    return lines


def choose_from_list(items: List[str], prompt: str) -> Optional[str]:
    if not items:
        return None
    log(prompt)
    for idx, item in enumerate(items, start=1):
        print(f"  {idx}. {item}")
    choice = require_input("Select a number or press Enter to cancel: ")
    if not choice:
        return None
    if not choice.isdigit():
        log("Invalid selection", "WARN")
        return None
    index = int(choice) - 1
    if index < 0 or index >= len(items):
        log("Selection out of range", "WARN")
        return None
    return items[index]


def random_duration_seconds() -> int:
    max_s = random.randint(DEFAULT_SCROLL_MAX_RANGE_S[0], DEFAULT_SCROLL_MAX_RANGE_S[1])
    return random.randint(DEFAULT_SCROLL_MIN_S, max_s)


def prompt_duration_seconds(label: str) -> int:
    prompt = (
        f"{label} duration in seconds (press Enter for random {DEFAULT_SCROLL_MIN_S}-{DEFAULT_SCROLL_MAX_RANGE_S[1]}s): "
    )
    value = require_input(prompt)
    if not value:
        return random_duration_seconds()
    try:
        secs = int(float(value))
        return max(5, secs)
    except ValueError:
        log("Invalid duration; using random default", "WARN")
        return random_duration_seconds()


def is_caught_up(driver) -> bool:
    phrases = [
        "you're all caught up",
        "you’re all caught up",
        "you're all caught up on posts",
        "you’re all caught up on posts",
        "all caught up",
    ]
    try:
        page = driver.page_source.lower()
    except Exception:
        return False

    for phrase in phrases:
        if phrase.lower() in page:
            return True
    return "caught up" in page


def handle_caught_up(driver, context_url: str) -> bool:
    log("You're all caught up on Instagram.", "INFO")
    choice = require_input("[R]efresh feed, [S]witch action, or [C]ontinue? ")
    if not choice:
        return True
    choice = choice.strip().lower()
    if choice.startswith("r"):
        log("Refreshing...", "INFO")
        driver.get(context_url)
        human_pause(2.0, 3.0)
        return True
    if choice.startswith("s"):
        log("Returning to menu...", "INFO")
        return False
    return True


def scroll_by(driver, amount: int) -> None:
    driver.execute_script("window.scrollBy(0, arguments[0]);", amount)


def scroll_up_down(bot: InstagramBot, steps: int = 1) -> None:
    driver = require_driver(bot)
    for _ in range(steps):
        amount = random.randint(200, 800)
        direction = random.choice([1, -1])
        scroll_by(driver, amount * direction)
        bot.move_mouse_random()
        human_pause(0.8, 1.8)


def get_visible_post_links(driver) -> List:
    return driver.find_elements(
        By.XPATH,
        "//a[contains(@href, '/p/') or contains(@href, '/reel/') or contains(@href, '/tv/')]",
    )


def open_random_post(bot: InstagramBot) -> bool:
    driver = require_driver(bot)
    links = get_visible_post_links(driver)
    if not links:
        return False
    link = random.choice(links)
    try:
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", link)
        human_pause(0.4, 0.9)
        bot.human_click(link)
        human_pause(1.8, 3.2)
        return True
    except Exception:
        return False


def close_post_overlay(bot: InstagramBot) -> None:
    driver = require_driver(bot)
    close_btn = bot.find_element_safe(By.XPATH, "//div[@role='dialog']//button//*[name()='svg' and @aria-label='Close']/ancestor::button")
    if close_btn:
        bot.human_click(close_btn)
        human_pause(0.6, 1.2)
        return
    try:
        driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
    except Exception:
        pass


def maybe_like_current_post(bot: InstagramBot) -> bool:
    buttons = find_like_buttons(bot)
    if not buttons:
        return False
    bot.human_click(buttons[0])
    human_pause(0.8, 1.6)
    return True


def open_comment_section(bot: InstagramBot) -> bool:
    driver = require_driver(bot)
    btn = bot.find_element_safe(
        By.XPATH,
        "//button//*[name()='svg' and @aria-label='Comment']/ancestor::button",
    )
    if not btn:
        btn = bot.find_element_safe(
            By.XPATH,
            "//span/*[name()='svg' and @aria-label='Comment']/ancestor::button",
        )
    if not btn:
        return False
    bot.human_click(btn)
    human_pause(0.8, 1.6)
    return True


def pick_safe_comment() -> Optional[str]:
    comments = load_lines(SAFE_COMMENTS_FILE)
    if not comments:
        return None
    return random.choice(comments)


def maybe_auto_comment(bot: InstagramBot) -> bool:
    comment = pick_safe_comment()
    if not comment:
        return False
    driver = require_driver(bot)
    comment_boxes = driver.find_elements(
        By.XPATH,
        "//textarea[contains(@aria-label,'Add a comment')] | //textarea[contains(@placeholder,'Add a comment')]",
    )
    if not comment_boxes:
        return False
    box = comment_boxes[0]
    bot.human_click(box)
    bot.human_type(box, comment)
    human_pause(0.6, 1.2)
    box.send_keys(Keys.ENTER)
    human_pause(1.0, 2.0)
    return True


def maybe_interact_with_post(bot: InstagramBot) -> None:
    if random.random() > 0.25:
        return
    if not open_random_post(bot):
        return

    human_pause(1.2, 2.4)
    if random.random() < RANDOM_LIKE_CHANCE:
        maybe_like_current_post(bot)

    if random.random() < COMMENT_SECTION_OPEN_CHANCE:
        if open_comment_section(bot):
            if random.random() < AUTO_COMMENT_AFTER_OPEN_CHANCE:
                maybe_auto_comment(bot)

    human_pause(1.0, 2.0)
    close_post_overlay(bot)


def prompt_optional_url(label: str) -> Optional[str]:
    return require_input(f"{label} (optional): ")


def validate_username(value: str) -> bool:
    return bool(USERNAME_RE.match(value))


def prompt_username() -> Optional[str]:
    while True:
        username = require_input("Recipient username (or type 'list' to view saved list): ")
        if not username:
            return None
        if username.lower() == "list":
            targets = load_lines(DM_TARGETS_FILE)
            selected = choose_from_list(targets, "Saved DM targets:")
            if selected:
                return selected
            continue
        if validate_username(username):
            return username
        log("Invalid username format. Use letters, numbers, underscore, or dot (1-30 chars).", "WARN")


def prompt_message() -> Optional[str]:
    message = require_input("Message (press Enter to choose from saved list): ")
    if message:
        return message
    messages = load_lines(DM_MESSAGES_FILE)
    selected = choose_from_list(messages, "Saved DM messages:")
    if selected:
        return selected
    if messages:
        return random.choice(messages)
    return None


def emit_action(account: SocialAccount, event_type: str, action: str, description: str, meta: Optional[dict] = None) -> None:
    payload = {
        "platform": "Instagram",
        "action": action,
        "username": account.username,
        "status": event_type,
        "description": description,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    if meta:
        payload.update(meta)

    # IMPORTANT: account_id is username to match backend account table
    emit_event(account.username, event_type, payload)


def ensure_session(bot: InstagramBot, account: SocialAccount) -> bool:
    log("Starting browser session...")
    driver = bot.start_browser()
    driver.get(BASE_URL)
    human_pause(2.0, 3.5)

    if account.cookies:
        log("Loading cookies from DB")
        bot.load_cookies()
        driver.get(BASE_URL)
        human_pause(2.0, 3.5)

    if not bot.is_logged_in():
        log("No logged-in session detected. Please login via login-bot first.", "ERROR")
        emit_action(account, "LOGIN_FAILED", "session_check", "Login not detected via cookies.")
        return False

    emit_action(account, "LOGIN_SUCCESS", "session_check", "Session confirmed via cookies.")
    log("Session confirmed")
    return True


def require_driver(bot: InstagramBot):
    if not bot.driver:
        raise RuntimeError("Browser is not initialized. Call ensure_session() first.")
    return bot.driver


def find_like_buttons(bot: InstagramBot):
    driver = require_driver(bot)
    # Like button SVG is typically aria-label="Like"
    return driver.find_elements(By.XPATH, "//span/*[name()='svg' and @aria-label='Like']/ancestor::button")


# ------------------------------------------------------------------
# Actions
# ------------------------------------------------------------------

def action_scroll_feed(bot: InstagramBot, account: SocialAccount):
    duration = prompt_duration_seconds("Feed scroll")
    log(f"Scrolling feed for ~{duration}s")
    emit_action(account, "ACTION_ATTEMPTED", "scroll_feed", f"Started scrolling feed for {duration}s")

    driver = require_driver(bot)
    driver.get(BASE_URL)
    human_pause(2.0, 3.5)

    end_time = time.time() + duration
    while time.time() < end_time:
        scroll_up_down(bot, steps=random.randint(1, 3))
        maybe_interact_with_post(bot)

        if is_caught_up(driver):
            if not handle_caught_up(driver, BASE_URL):
                return

    emit_action(account, "ACTION_SUCCESS", "scroll_feed", "Finished scrolling feed")


def action_explore(bot: InstagramBot, account: SocialAccount):
    duration = prompt_duration_seconds("Explore scroll")
    log(f"Opening explore page for ~{duration}s")
    emit_action(account, "ACTION_ATTEMPTED", "explore", f"Opened explore page for {duration}s")

    driver = require_driver(bot)
    explore_url = f"{BASE_URL}explore/"
    reels_url = f"{BASE_URL}reels/"
    driver.get(explore_url)
    human_pause(2.0, 3.5)

    end_time = time.time() + duration
    mode = "explore"
    while time.time() < end_time:
        scroll_up_down(bot, steps=random.randint(1, 3))
        maybe_interact_with_post(bot)

        if random.random() < 0.25:
            mode = "reels" if mode == "explore" else "explore"
            driver.get(reels_url if mode == "reels" else explore_url)
            human_pause(2.0, 3.0)

        if is_caught_up(driver):
            if not handle_caught_up(driver, explore_url if mode == "explore" else reels_url):
                return

    emit_action(account, "ACTION_SUCCESS", "explore", "Explored trending posts")


def action_like(bot: InstagramBot, account: SocialAccount):
    link = prompt_optional_url("Post/Reel link")
    log("Attempting to like a post")
    emit_action(account, "ACTION_ATTEMPTED", "like", "Attempting to like a post")

    driver = require_driver(bot)
    if link:
        driver.get(link)
        human_pause(2.0, 3.5)
    else:
        driver.get(BASE_URL)
        human_pause(2.0, 3.5)
        if not open_random_post(bot):
            log("No visible post found; trying like button in feed", "WARN")

    if not maybe_like_current_post(bot):
        emit_action(account, "ACTION_FAILED", "like", "No likeable post found")
        log("No likeable post found", "WARN")
        return

    emit_action(account, "ACTION_SUCCESS", "like", "Post liked")


def action_comment(bot: InstagramBot, account: SocialAccount):
    link = prompt_optional_url("Post/Reel link")
    comment = require_input("Enter comment text (press Enter to use a safe comment): ")
    if not comment:
        comment = pick_safe_comment()
    if not comment:
        log("No comment provided", "WARN")
        return

    log("Attempting to comment")
    emit_action(account, "ACTION_ATTEMPTED", "comment", f"Commenting: {comment}")

    driver = require_driver(bot)
    if link:
        driver.get(link)
        human_pause(2.0, 3.5)
    else:
        driver.get(BASE_URL)
        human_pause(2.0, 3.5)
        if not open_random_post(bot):
            log("No visible post found; continuing on feed", "WARN")

    comment_boxes = driver.find_elements(By.XPATH, "//textarea[contains(@aria-label,'Add a comment')] | //textarea[contains(@placeholder,'Add a comment')]")
    if not comment_boxes:
        emit_action(account, "ACTION_FAILED", "comment", "No comment box found")
        log("Comment box not found", "WARN")
        return

    box = comment_boxes[0]
    bot.human_click(box)
    bot.human_type(box, comment)
    human_pause(0.6, 1.2)
    box.send_keys(Keys.ENTER)
    human_pause(1.0, 2.0)

    emit_action(account, "ACTION_SUCCESS", "comment", "Comment posted", {"comment": comment})


def action_follow(bot: InstagramBot, account: SocialAccount):
    username = require_input("Username to follow: ")
    if not username:
        return

    log(f"Following @{username}")
    emit_action(account, "ACTION_ATTEMPTED", "follow", f"Following @{username}", {"target": username})

    driver = require_driver(bot)
    driver.get(f"{BASE_URL}{username}/")
    human_pause(2.0, 3.5)

    follow_btn = bot.find_element_safe(By.XPATH, "//button[normalize-space()='Follow']")
    if not follow_btn:
        emit_action(account, "ACTION_FAILED", "follow", "Follow button not found", {"target": username})
        log("Follow button not found", "WARN")
        return

    bot.human_click(follow_btn)
    human_pause(1.0, 2.0)
    emit_action(account, "ACTION_SUCCESS", "follow", f"Followed @{username}", {"target": username})


def action_unfollow(bot: InstagramBot, account: SocialAccount):
    username = require_input("Username to unfollow: ")
    if not username:
        return

    log(f"Unfollowing @{username}")
    emit_action(account, "ACTION_ATTEMPTED", "unfollow", f"Unfollowing @{username}", {"target": username})

    driver = require_driver(bot)
    driver.get(f"{BASE_URL}{username}/")
    human_pause(2.0, 3.5)

    following_btn = bot.find_element_safe(By.XPATH, "//button[normalize-space()='Following' or normalize-space()='Requested']")
    if not following_btn:
        emit_action(account, "ACTION_FAILED", "unfollow", "Following button not found", {"target": username})
        log("Following button not found", "WARN")
        return

    bot.human_click(following_btn)
    human_pause(0.8, 1.4)

    confirm_btn = bot.find_element_safe(By.XPATH, "//button[normalize-space()='Unfollow']")
    if confirm_btn:
        bot.human_click(confirm_btn)
        human_pause(1.0, 2.0)

    emit_action(account, "ACTION_SUCCESS", "unfollow", f"Unfollowed @{username}", {"target": username})


def action_dm(bot: InstagramBot, account: SocialAccount):
    username = prompt_username()
    message = prompt_message()

    if not username or not message:
        log("DM cancelled", "WARN")
        return

    log(f"Sending DM to @{username}")
    emit_action(account, "ACTION_ATTEMPTED", "dm", f"Sending DM to @{username}", {"target": username})

    driver = require_driver(bot)
    driver.get(f"{BASE_URL}direct/new/")
    human_pause(2.5, 4.0)

    # "To" input
    to_input = bot.find_element_safe(By.XPATH, "//input[@name='queryBox']")
    if not to_input:
        emit_action(account, "ACTION_FAILED", "dm", "DM recipient field not found", {"target": username})
        log("DM recipient field not found", "WARN")
        return

    bot.human_click(to_input)
    bot.human_type(to_input, username)
    human_pause(1.2, 2.0)

    first_result = bot.find_element_safe(By.XPATH, "(//div[@role='dialog']//div[@role='button'])[1]")
    if first_result:
        bot.human_click(first_result)
        human_pause(0.6, 1.2)

    next_btn = bot.find_element_safe(By.XPATH, "//div[@role='dialog']//button[normalize-space()='Next']")
    if next_btn:
        bot.human_click(next_btn)
        human_pause(1.5, 2.5)

    msg_box = bot.find_element_safe(By.XPATH, "//textarea[@placeholder='Message...']")
    if not msg_box:
        emit_action(account, "ACTION_FAILED", "dm", "Message box not found", {"target": username})
        log("Message box not found", "WARN")
        return

    bot.human_click(msg_box)
    bot.human_type(msg_box, message)
    human_pause(0.6, 1.2)
    msg_box.send_keys(Keys.ENTER)

    emit_action(account, "ACTION_SUCCESS", "dm", "DM sent", {"target": username, "message": message})


MENU = """
================= InstaFlow Control =================
1. Scroll Feed
2. Explore Page
3. Like a Post
4. Comment on a Post
5. Follow a User
6. Unfollow a User
7. Send DM
0. Exit
=====================================================
"""

ActionFn = Callable[[InstagramBot, SocialAccount], None]

ACTIONS: Dict[str, ActionFn] = {
    "1": action_scroll_feed,
    "2": action_explore,
    "3": action_like,
    "4": action_comment,
    "5": action_follow,
    "6": action_unfollow,
    "7": action_dm,
}


def load_logged_in_account() -> Optional[SocialAccount]:
    log("Searching for logged-in Instagram account...")

    account = (
        SocialAccount.objects
        .filter(platform="IG", logged_in=True)
        .order_by("-last_login")
        .first()
    )

    if not account:
        log("No logged-in Instagram account found.", "ERROR")
        return None

    log(f"Loaded account @{account.username}")
    return account


def main():
    account = load_logged_in_account()
    if not account:
        return

    bot = InstagramBot(account)

    try:
        if not ensure_session(bot, account):
            return

        while True:
            print(MENU)
            choice = require_input("Select action: ")

            if choice == "0":
                log("Exiting control menu")
                break

            if choice is None:
                log("No selection provided", "WARN")
                continue

            action = ACTIONS.get(choice)
            if not action:
                log("Invalid option", "WARN")
                continue

            try:
                action(bot, account)
            except Exception as exc:
                log(f"Action failed: {exc}", "ERROR")
                traceback.print_exc()
                emit_action(account, "ACTION_FAILED", "menu_action", "Unhandled exception", {"error": str(exc)})

            human_pause(1.5, 3.0)

    finally:
        log("Closing browser session")
        bot.close_browser(delay=2)


def run_menu():
    main()


if TEXTUAL_AVAILABLE:
    class InstaFlowTextualApp(App):
        CSS = """
        Screen {
            layout: vertical;
        }
        #body {
            layout: horizontal;
            height: 1fr;
        }
        #menu {
            width: 32;
            border: solid gray;
        }
        #log {
            border: solid gray;
            width: 1fr;
        }
        """

        def __init__(self):
            super().__init__()
            self._busy = False
            self._actions: List[Tuple[str, str]] = [
                ("1", "Scroll Feed"),
                ("2", "Explore Page"),
                ("3", "Like a Post"),
                ("4", "Comment on a Post"),
                ("5", "Follow a User"),
                ("6", "Unfollow a User"),
                ("7", "Send DM"),
                ("0", "Exit"),
            ]

        def compose(self) -> ComposeResult:
            yield Header()
            with Static(id="body"):
                items = [ListItem(Label(f"{key}. {label}")) for key, label in self._actions]
                yield ListView(*items, id="menu")
                yield RichLog(id="log", markup=False)
            yield Footer()

        def on_mount(self) -> None:
            self.query_one(ListView).focus()
            self._add_log("[INFO] Textual UI ready. Select an action from the left panel.")

        def _add_log(self, message: str) -> None:
            log_widget = self.query_one("#log", RichLog)
            log_widget.write(message)

        def _set_busy(self, value: bool) -> None:
            self._busy = value
            menu = self.query_one(ListView)
            menu.disabled = value

        def _run_action(self, action_key: str) -> None:
            action = ACTIONS.get(action_key)
            if not action:
                log("Invalid option", "WARN")
                return
            account = load_logged_in_account()
            if not account:
                return
            bot = InstagramBot(account)
            try:
                if ensure_session(bot, account):
                    action(bot, account)
            finally:
                bot.close_browser(delay=2)

        @work(thread=True)
        def _worker(self, action_key: str) -> None:
            try:
                self._run_action(action_key)
            finally:
                self.call_from_thread(self._set_busy, False)

        def on_list_view_selected(self, event: ListView.Selected) -> None:
            if self._busy:
                return
            index = event.list_view.index
            if index is None:
                return
            action_key = self._actions[index][0]
            if action_key == "0":
                self.exit()
                return
            self._set_busy(True)
            self._worker(action_key)


if TYPER_AVAILABLE:
    cli = typer.Typer(help="InstaFlow Instagram Action Control")

    @cli.callback(invoke_without_command=True)
    def main_callback(ctx: typer.Context):
        if ctx.invoked_subcommand is None:
            run_menu()

    @cli.command()
    def menu():
        """Open the interactive menu."""
        run_menu()

    @cli.command(name="scroll-feed")
    def scroll_feed_cmd():
        """Scroll the feed with human-like behavior."""
        account = load_logged_in_account()
        if not account:
            return
        bot = InstagramBot(account)
        try:
            if ensure_session(bot, account):
                action_scroll_feed(bot, account)
        finally:
            bot.close_browser(delay=2)

    @cli.command()
    def explore():
        """Explore posts with human-like behavior."""
        account = load_logged_in_account()
        if not account:
            return
        bot = InstagramBot(account)
        try:
            if ensure_session(bot, account):
                action_explore(bot, account)
        finally:
            bot.close_browser(delay=2)

    @cli.command()
    def like():
        """Like a post or reel."""
        account = load_logged_in_account()
        if not account:
            return
        bot = InstagramBot(account)
        try:
            if ensure_session(bot, account):
                action_like(bot, account)
        finally:
            bot.close_browser(delay=2)

    @cli.command()
    def comment():
        """Comment on a post or reel."""
        account = load_logged_in_account()
        if not account:
            return
        bot = InstagramBot(account)
        try:
            if ensure_session(bot, account):
                action_comment(bot, account)
        finally:
            bot.close_browser(delay=2)

    @cli.command()
    def follow():
        """Follow a user."""
        account = load_logged_in_account()
        if not account:
            return
        bot = InstagramBot(account)
        try:
            if ensure_session(bot, account):
                action_follow(bot, account)
        finally:
            bot.close_browser(delay=2)

    @cli.command()
    def unfollow():
        """Unfollow a user."""
        account = load_logged_in_account()
        if not account:
            return
        bot = InstagramBot(account)
        try:
            if ensure_session(bot, account):
                action_unfollow(bot, account)
        finally:
            bot.close_browser(delay=2)

    @cli.command()
    def dm():
        """Send a DM."""
        account = load_logged_in_account()
        if not account:
            return
        bot = InstagramBot(account)
        try:
            if ensure_session(bot, account):
                action_dm(bot, account)
        finally:
            bot.close_browser(delay=2)


if __name__ == "__main__":
    if TEXTUAL_AVAILABLE:
        def _sink(msg: str) -> None:
            app = getattr(InstaFlowTextualApp, "_active_app", None)
            if not app:
                return
            try:
                app.call_from_thread(app._add_log, msg)
            except RuntimeError:
                app._add_log(msg)

        app = InstaFlowTextualApp()
        InstaFlowTextualApp._active_app = app
        LOG_SINK = _sink
        app.run()
    elif TYPER_AVAILABLE:
        cli()
    else:
        main()
