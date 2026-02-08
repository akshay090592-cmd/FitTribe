from playwright.sync_api import sync_playwright, expect
import os

def verify_victory_photo():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        # Bypass tutorial
        context.add_init_script("localStorage.setItem('tutorial_seen', 'true')")

        page = context.new_page()

        try:
            print("Navigating to app...")
            page.goto("http://localhost:3000")

            print("Waiting for load...")
            page.wait_for_load_state("networkidle")

            # Wait for dashboard to load (Mock Mode)
            print("Waiting for Dashboard text 'Hi, NewUser!'...")
            try:
                expect(page.get_by_text("Hi, NewUser!")).to_be_visible(timeout=5000)
            except AssertionError:
                 print("Dashboard not found. Taking debug screenshot.")
                 page.screenshot(path="verification/dashboard_missing.png")
                 raise

            # Click "Track Activity" button
            print("Clicking Track Activity...")
            # Use .first to avoid ambiguity if multiple elements match or refine selector
            page.get_by_text("Track Activity").first.click()

            # Wait for modal header
            print("Waiting for modal header...")
            expect(page.get_by_role("heading", name="Track Activity")).to_be_visible()

            # Verify "Share Victory Selfie" is present
            print("Checking for Victory Selfie option...")
            expect(page.get_by_text("Share Victory Selfie")).to_be_visible()

            # Take screenshot
            page.screenshot(path="verification/victory_photo_option.png", full_page=True)
            print("Verification successful, screenshot saved.")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/failure.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_victory_photo()
