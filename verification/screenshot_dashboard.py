from playwright.sync_api import sync_playwright
import json

def screenshot_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # Mock profile data
        mock_profile = {
            "id": "mock-id",
            "email": "mock@test.com",
            "displayName": "TestPanda",
            "avatarId": "male",
            "tribeId": "mock-tribe",
            "fitnessLevel": "beginner"
        }

        def setup_page(page):
            page.goto("http://localhost:3000")
            page.evaluate(f"localStorage.setItem('current_user_profile', '{json.dumps(mock_profile)}')")
            page.evaluate("localStorage.setItem('tutorial_seen', 'true')")
            page.reload()
            page.wait_for_timeout(5000)

        # Mobile screenshot
        context_mobile = browser.new_context(viewport={'width': 375, 'height': 812})
        page_mobile = context_mobile.new_page()
        setup_page(page_mobile)
        page_mobile.screenshot(path="verification/dashboard_mobile.png")

        # Desktop screenshot
        context_desktop = browser.new_context(viewport={'width': 1280, 'height': 800})
        page_desktop = context_desktop.new_page()
        setup_page(page_desktop)
        page_desktop.screenshot(path="verification/dashboard_desktop.png")

        browser.close()

if __name__ == "__main__":
    screenshot_dashboard()
