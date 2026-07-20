from uuid import uuid4

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait

from helpers import register_user


def create_task(browser, title, priority="medium"):
    browser.find_element(By.CSS_SELECTOR, "input[aria-label='Task title']").send_keys(title)
    Select(browser.find_element(By.CSS_SELECTOR, "select[aria-label='Task priority']")).select_by_value(priority)
    browser.find_element(By.CSS_SELECTOR, ".task-form button[type='submit']").click()


def test_user_can_filter_tasks(browser, frontend_url):
    wait = WebDriverWait(browser, 10)
    token = uuid4().hex[:6]
    high_title = f"High {token}"
    low_title = f"Low {token}"

    register_user(browser, frontend_url)
    create_task(browser, high_title, priority="high")
    wait.until(EC.text_to_be_present_in_element((By.CLASS_NAME, "task-list"), high_title))
    create_task(browser, low_title, priority="low")
    wait.until(EC.text_to_be_present_in_element((By.CLASS_NAME, "task-list"), low_title))

    Select(browser.find_element(By.CSS_SELECTOR, "select[aria-label='Filter by priority']")).select_by_value("high")

    wait.until(EC.text_to_be_present_in_element((By.CLASS_NAME, "task-list"), high_title))
    wait.until_not(EC.text_to_be_present_in_element((By.CLASS_NAME, "task-list"), low_title))
    assert high_title in browser.find_element(By.CLASS_NAME, "task-list").text
