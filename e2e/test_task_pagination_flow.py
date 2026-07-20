from uuid import uuid4

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait

from helpers import register_user


def test_user_can_paginate_tasks(browser, frontend_url):
    wait = WebDriverWait(browser, 10)
    token = uuid4().hex[:6]
    first_title = f"Page first {token}"
    last_title = f"Page last {token}"

    register_user(browser, frontend_url)
    Select(browser.find_element(By.CSS_SELECTOR, "select[aria-label='Page size']")).select_by_value("5")

    for index in range(6):
        title = first_title if index == 0 else last_title if index == 5 else f"Page task {token}-{index}"
        browser.find_element(By.CSS_SELECTOR, "input[aria-label='Task title']").send_keys(title)
        browser.find_element(By.CSS_SELECTOR, ".task-form button[type='submit']").click()
        wait.until(EC.text_to_be_present_in_element((By.CLASS_NAME, "task-list"), title))

    assert last_title in browser.find_element(By.CLASS_NAME, "task-list").text
    browser.find_element(By.XPATH, "//button[normalize-space()='Next']").click()

    wait.until(EC.text_to_be_present_in_element((By.CLASS_NAME, "task-list"), first_title))
    assert first_title in browser.find_element(By.CLASS_NAME, "task-list").text

    browser.find_element(By.XPATH, "//button[normalize-space()='Previous']").click()
    wait.until(EC.text_to_be_present_in_element((By.CLASS_NAME, "task-list"), last_title))
