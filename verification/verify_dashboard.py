
from playwright.sync_api import Page, expect, sync_playwright
import time

def test_dashboard_loads(page: Page):
    print("Navigating to dashboard...")
    page.goto("http://localhost:5173")

    # Wait for the canvas to be present (Three.js scene)
    print("Waiting for canvas...")
    page.wait_for_selector("canvas", timeout=10000)

    # Wait a bit for the scene to render and animations to start
    time.sleep(5)

    # Take a screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification/dashboard_loaded.png")
    print("Screenshot saved.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_dashboard_loads(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_state.png")
        finally:
            browser.close()
