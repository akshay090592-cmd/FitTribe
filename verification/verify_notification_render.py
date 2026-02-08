from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()

    # Bypass tutorial
    context.add_init_script("localStorage.setItem('tutorial_seen', 'true')")

    page = context.new_page()

    try:
        page.goto("http://localhost:3000")

        # Wait for app load
        page.wait_for_selector("button[aria-label='Notifications']", timeout=10000)

        # Click notifications
        page.click("button[aria-label='Notifications']")

        # Check for mock notification
        expect(page.get_by_text("Mock Notification with Image")).to_be_visible()

        # Check for image
        expect(page.locator("img[alt='Attachment']")).to_be_visible()

        # Screenshot
        page.screenshot(path="verification/notification_render.png")
        print("Verified notification render.")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/notification_failure.png")
        raise e
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
