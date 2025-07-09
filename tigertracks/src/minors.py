from selenium import webdriver
from selenium.webdriver.common.by import By

from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

options = Options()
options.add_argument("--headless")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

url = 'https://www.princeton.edu/academics/areas-of-study'
driver.get(url)


minor_elements = driver.find_elements(By.CSS_SELECTOR, 'li.row.accordion-item.row.undergraduate-minor h2')
minors = [element.text for element in minor_elements]
print(minors)
driver.quit()