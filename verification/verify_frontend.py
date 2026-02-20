from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to http://localhost:5173...")
        try:
            page.goto("http://localhost:5173", timeout=10000)
            print("Page loaded.")

            # Wait for the app to render (look for the header)
            page.wait_for_selector("text=Trade Animator Pro")
            print("Found header.")

            # Take screenshot of initial state
            page.screenshot(path="verification/frontend_initial.png")
            print("Screenshot saved to verification/frontend_initial.png")

        except Exception as e:
            print(f"Error: {e}")
            # Take screenshot anyway to see what's wrong (e.g. error page)
            page.screenshot(path="verification/frontend_error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
