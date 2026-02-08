
import asyncio
from playwright.async_api import async_playwright
import json

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        # Mock auth and profile
        await page.add_init_script("""
            localStorage.setItem('tutorial_seen', 'true');
            localStorage.setItem('current_user_profile', JSON.stringify({
                id: 'mock-id',
                displayName: 'TestUser',
                email: 'test@example.com',
                avatarId: 'male',
                tribeId: 'test-tribe'
            }));
            localStorage.setItem('sb-placeholder-auth-token', JSON.stringify({
                access_token: 'mock-token',
                token_type: 'bearer',
                expires_in: 3600,
                refresh_token: 'mock-refresh',
                user: { id: 'mock-id', email: 'test@example.com' }
            }));
        """)

        await page.goto("http://localhost:3000")

        # Wait for dashboard
        await page.wait_for_selector("text=Hi, TestUser!")
        print("Logged in successfully")

        # Open Track Activity
        await page.click("text=Track Activity")
        await page.wait_for_selector("text=Positive Vibes", state="hidden") # Should be hidden initially

        # Select Wellbeing activities
        await page.select_option("select", label="Wellbeing activities")
        await page.wait_for_selector("text=Positive Vibes")
        print("Vibes display active")

        # Set duration and intensity
        await page.fill("#duration-input", "30")
        # Intensity is range, default is 5. 30 * (5/5) = 30 vibes.

        await page.wait_for_selector("text=30")
        print("Vibes calculated correctly")

        # Save activity
        await page.click("text=Log Workout")

        # Verify in Feed (Social tab)
        await page.click("button:has-text('Tribe')")
        await page.wait_for_selector("text=30 vibes")
        await page.wait_for_selector(".lucide-heart")
        print("Verified vibes and heart icon in Feed")

        # Verify in History (Stats tab)
        await page.click("button:has-text('Stats')")
        await page.click("text=Workout History")
        await page.wait_for_selector("text=30")
        await page.wait_for_selector(".lucide-heart")
        print("Verified vibes and heart icon in History")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
