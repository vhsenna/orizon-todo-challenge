from uuid import uuid4

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from helpers import register_user


def test_user_can_create_category(browser, frontend_url):
    wait = WebDriverWait(browser, 10)
    category_name = f"Work {uuid4().hex[:6]}"

    register_user(browser, frontend_url)
    browser.find_element(By.CSS_SELECTOR, "input[aria-label='Category name']").send_keys(category_name)
    browser.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    wait.until(EC.text_to_be_present_in_element((By.CLASS_NAME, "category-list"), category_name))
    assert category_name in browser.find_element(By.CLASS_NAME, "category-list").text
