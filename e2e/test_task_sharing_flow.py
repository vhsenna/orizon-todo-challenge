from uuid import uuid4

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from helpers import login_user, register_user


def test_user_can_share_task_with_another_user(browser, frontend_url):
    wait = WebDriverWait(browser, 10)
    task_title = f"Shared e2e {uuid4().hex[:6]}"

    shared_user = register_user(browser, frontend_url)
    browser.find_element(By.CSS_SELECTOR, "button[aria-label='Log out']").click()
    wait.until(EC.url_contains("/login"))

    register_user(browser, frontend_url)
    browser.find_element(By.CSS_SELECTOR, "input[aria-label='Task title']").send_keys(task_title)
    browser.find_element(By.CSS_SELECTOR, ".task-form button[type='submit']").click()
    wait.until(EC.text_to_be_present_in_element((By.CLASS_NAME, "task-list"), task_title))

    task_card = browser.find_element(By.XPATH, f"//article[contains(., '{task_title}')]")
    task_card.find_element(By.CSS_SELECTOR, "button[aria-label='Share task']").click()
    task_card.find_element(By.CSS_SELECTOR, "input[aria-label='Share with email']").send_keys(shared_user["email"])
    task_card.find_element(By.CSS_SELECTOR, ".share-form button[aria-label='Share task']").click()
    wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, ".share-form")))

    browser.find_element(By.CSS_SELECTOR, "button[aria-label='Log out']").click()
    wait.until(EC.url_contains("/login"))

    login_user(browser, frontend_url, shared_user["email"], shared_user["password"])
    wait.until(EC.text_to_be_present_in_element((By.CLASS_NAME, "task-list"), task_title))
    assert task_title in browser.find_element(By.CLASS_NAME, "task-list").text
