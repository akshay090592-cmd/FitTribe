
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
        """)

        await page.goto("http://localhost:3000")

        # Take screenshot
        await page.screenshot(path="failed_dashboard.png")
        print("Screenshot saved to failed_dashboard.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
