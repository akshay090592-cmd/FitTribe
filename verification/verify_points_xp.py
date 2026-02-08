import time
from playwright.sync_api import sync_playwright

def verify_points_xp():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mobile view for better layout simulation
        context = browser.new_context(viewport={'width': 375, 'height': 812})
        page = context.new_page()

        print("Navigating to app...")
        page.goto("http://localhost:3000")

        # Bypass tutorial if present
        page.evaluate("localStorage.setItem('tutorial_seen', 'true')")
        page.reload()

        # Wait for load
        page.wait_for_timeout(5000)

        print("Checking if loaded...")
        try:
            # Check for header
            page.wait_for_selector("h1", timeout=5000)
            print("Header found.")
        except:
            print("Header not found. App might not be loaded.")
            page.screenshot(path="verification/not_loaded.png")
            raise

        # 1. Verify XP Breakdown in User Profile Popup
        print("Opening User Profile...")

        print("Navigating to Social Tab...")
        # Use selector for bottom nav if get_by_label fails
        # The icons are Lucide icons.
        # Bottom nav is fixed at bottom.
        # Let's try locating by text if possible, but nav doesn't have text unless active.
        # Let's try finding the button by index. 2nd button is Tribe.
        buttons = page.locator("nav button").all() # Or look for floating dock
        # Dock class: fixed bottom-6 ... flex justify-between
        dock = page.locator(".fixed.bottom-6.flex")
        if dock.count() > 0:
            print("Found dock.")
            # 2nd button (index 1) is Tribe
            dock.locator("button").nth(1).click()
        else:
            print("Dock not found. Trying aria-label again.")
            page.get_by_label("Tribe").click()

        page.wait_for_timeout(1000)

        # Click first user in Leaderboard
        print("Clicking first user...")
        try:
            page.get_by_text("NewUser").first.click()
        except:
            print("Could not find NewUser, trying any user")
            page.locator(".flex.items-center.justify-between").first.click()

        page.wait_for_timeout(1000)

        # Now UserProfilePopup should be open
        # Click "View XP History"
        print("Clicking View XP History...")
        try:
            page.get_by_role("button", name="View XP History").click()
        except:
            print("Failed to click View XP History. Screenshotting.")
            page.screenshot(path="verification/failed_xp_click.png")
            # Maybe the popup didn't open?
            # Or mock mode didn't load profile correctly?
            # In mock mode, UserProfilePopup depends on fetching profile.
            pass # Continue to try Points

        page.wait_for_timeout(1000)

        # Screenshot XP History
        print("Taking screenshot of XP History...")
        page.screenshot(path="verification/xp_history.png")

        # Close popups
        page.mouse.click(10, 10) # Click outside
        page.wait_for_timeout(500)
        page.mouse.click(10, 10) # Click outside again

        # 2. Verify Points History in Profile Page
        print("Navigating to Profile Page...")
        # Using floating nav if visible
        if dock.count() > 0:
             dock.locator("button").nth(0).click() # Home
        else:
             page.get_by_label("Home").click()

        page.wait_for_timeout(500)

        # Click Avatar to go to Profile Page
        print("Clicking Avatar...")
        page.locator("img[src*='panda']").first.click()
        page.wait_for_timeout(1000)

        # Find Points Card
        # It has text "Points" and the value.
        print("Clicking Points Card...")
        # The card contains "Points" text.
        # We can find the element containing "Points" and click it.
        try:
            points_text = page.get_by_text("Points").last
            points_text.click()
            page.wait_for_timeout(1000)

            # Screenshot Points History
            print("Taking screenshot of Points History...")
            page.screenshot(path="verification/points_history.png")
        except:
            print("Failed to click Points card.")
            page.screenshot(path="verification/failed_points.png")

        browser.close()

if __name__ == "__main__":
    verify_points_xp()
