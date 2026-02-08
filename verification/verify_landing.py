from playwright.sync_api import Page, expect, sync_playwright
import os

def verify_landing(page: Page):
    print("Navigating to http://localhost:3000")
    page.goto("http://localhost:3000")

    # Wait for the main title
    print("Waiting for title...")
    expect(page.get_by_text("Panda Jungle Gym")).to_be_visible()

    # Take screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification/landing_page.png", full_page=True)
    print("Screenshot saved to verification/landing_page.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_landing(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
