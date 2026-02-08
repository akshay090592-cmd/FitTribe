from playwright.sync_api import Page, expect, sync_playwright
import time

def test_header_loader(page: Page):
    # 1. Go to app
    print("Navigating...")
    page.goto("http://localhost:3000")

    # 2. Skip tutorial
    print("Skipping tutorial...")
    page.evaluate("localStorage.setItem('tutorial_seen', 'true')")
    page.reload()

    # 3. Wait for dashboard
    print("Waiting for NewUser...")
    expect(page.get_by_text("Hi, NewUser!")).to_be_visible(timeout=10000)

    # 4. Take screenshot
    print("Taking screenshot...")
    time.sleep(2) # Wait for animations
    page.screenshot(path="verification/dashboard_header.png")
    print("Screenshot saved.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812}) # Mobile viewport
        try:
            test_header_loader(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
