from uuid import uuid4

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


def register_user(browser, frontend_url):
    token = uuid4().hex[:10]
    browser.get(f"{frontend_url}/register")
    browser.find_element(By.NAME, "email").send_keys(f"e2e-{token}@example.com")
    browser.find_element(By.NAME, "username").send_keys(f"e2e_{token}")
    browser.find_element(By.NAME, "password").send_keys("secure-pass-123")
    browser.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    WebDriverWait(browser, 10).until(EC.url_contains("/tasks"))


def test_user_can_create_category(browser, frontend_url):
    wait = WebDriverWait(browser, 10)
    category_name = f"Work {uuid4().hex[:6]}"

    register_user(browser, frontend_url)
    browser.find_element(By.CSS_SELECTOR, "input[aria-label='Category name']").send_keys(category_name)
    browser.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    wait.until(EC.text_to_be_present_in_element((By.CLASS_NAME, "category-list"), category_name))
    assert category_name in browser.find_element(By.CLASS_NAME, "category-list").text
