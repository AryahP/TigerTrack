from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.common.exceptions import WebDriverException, NoSuchElementException, TimeoutException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time # Import time for sleep

from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

# --- Configuration for Chrome Options ---
options = Options()
options.add_argument("--headless")
options.add_argument("--no-sandbox") # Essential for many headless environments (e.g., Docker, Linux)
options.add_argument("--disable-dev-shm-usage") # Addresses resource limitations in some environments
# options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36") # Optional user-agent

driver = None # Initialize driver to None

try:
    print("Attempting to install/update ChromeDriver and initialize WebDriver...")
    service = Service(Service(ChromeDriverManager().install()))
    driver = webdriver.Chrome(service=service, options=options)
    print("WebDriver initialized successfully.")

    url = 'https://registrar.princeton.edu/course-offerings'
    print(f"Navigating to URL: {url}")
    driver.get(url)

    # --- Debugging: Add a short sleep after page load ---
    # This is a temporary measure to diagnose if the issue is a very subtle timing problem.
    # If this works, then a more robust explicit wait strategy is needed.
    print("Pausing for 3 seconds to allow full page rendering (for debugging)...")
    time.sleep(3) # A short, fixed wait for debugging purposes

    # --- Debugging: Print Page Source ---
    # This will show you exactly what HTML Selenium sees after loading the URL.
    # Check this output to see if 'id="cs-subject-1"' is actually present.
    print("\n--- Current Page Source (first 2000 chars) ---")
    print(driver.page_source[:2000]) # Print first 2000 characters for brevity
    print("----------------------------------------------")

    # --- NEW: Wait for a stable parent element first ---
    print("Waiting for the parent container of the dropdown...")
    wait = WebDriverWait(driver, 30)
    parent_container = wait.until(EC.presence_of_element_located((By.CLASS_NAME, "filter-contents")))
    print("Parent container found. Now finding dropdown within it.")

    # --- Enhanced Explicit Wait for the Dropdown (now within parent_container) ---
    print("Waiting for the subject dropdown to be VISIBLE and CLICKABLE...")
    # This will now attempt to find 'cs-subject-1' within the context of the entire page
    # after the parent container is present.
    dropdown = wait.until(EC.visibility_of_element_located((By.ID, "cs-subject-1")))
    # Also wait for it to be clickable, implies it's fully rendered and interactive
    wait.until(EC.element_to_be_clickable((By.ID, "cs-subject-1")))
    print("Subject dropdown found and is interactive.")

    print("Extracting options...")
    # Find options from the dropdown element found
    options_elements = dropdown.find_elements(By.TAG_NAME, "option")
    # Extract course codes, filter out empty values (e.g., the default "All Subjects" option if value is empty)
    course_codes = [option.get_attribute("value") for option in options_elements if option.get_attribute("value")]

    # Filter for codes that are exactly 3 characters long (e.g., "AAS", "COS")
    course_codes = [code for code in course_codes if len(code) == 3]

    print("\n--- Extracted Course Subject Codes (3-letter) ---")
    print(course_codes)
    print(f"Total 3-letter subject codes found: {len(course_codes)}")

except WebDriverException as e:
    print(f"\n[WebDriver Error] A problem occurred with the WebDriver setup or Chrome browser.")
    print(f"Error details: {e}")
    print("\nCommon solutions:")
    print("1. Ensure Google Chrome browser is installed on your system.")
    print("2. Check your Chrome browser version. It might have updated, causing a mismatch with ChromeDriver.")
    print("3. Try updating `webdriver-manager`: `pip install --upgrade webdriver-manager`")
    print("4. If `webdriver-manager` consistently fails, manually download ChromeDriver compatible with your Chrome version from https://chromedriver.chromium.org/downloads and specify its path:")
    print("   e.g., `service = Service('/path/to/your/chromedriver')`")
    print("5. Check network/firewall settings if `webdriver-manager` cannot download ChromeDriver.")
    print("6. If running in a Docker container or headless server, ensure necessary Chrome dependencies are installed.")
except NoSuchElementException as e:
    print(f"\n[Element Not Found Error] Could not find the expected HTML element.")
    print(f"Error details: {e}")
    print("This indicates that after waiting, the element with ID 'cs-subject-1' was still not found or accessible.")
    print("This might mean:")
    print("  - The ID 'cs-subject-1' is genuinely not on the page at all in the rendered source (check page source print).")
    print("  - The element is inside an iframe. You need to switch to it first.")
    print("  - The element is generated by JavaScript that requires interaction or more time.")
except TimeoutException as e:
    print(f"\n[Timeout Error] The specified element did not become visible/clickable within the given time.")
    print(f"Error details: {e}")
    print("This suggests the element with ID 'cs-subject-1' is either not loading, is hidden, or the ID is incorrect.")
    print("Verify the element ID on the website again, or increase the WebDriverWait timeout further.")
except Exception as e:
    print(f"\n[An Unexpected Error Occurred]")
    print(f"Error details: {e}")

finally:
    # Always quit the driver to free up resources, even if an error occurred
    if driver:
        print("\nQuitting WebDriver...")
        driver.quit()
        print("WebDriver quit.")