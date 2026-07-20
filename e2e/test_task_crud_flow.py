from uuid import uuid4

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait

from helpers import register_user


def test_user_can_create_edit_and_delete_task(browser, frontend_url):
    wait = WebDriverWait(browser, 10)
    title = f"Task {uuid4().hex[:6]}"
    edited_title = f"Edited {title}"

    register_user(browser, frontend_url)

    browser.find_element(By.CSS_SELECTOR, "input[aria-label='Task title']").send_keys(title)
    browser.find_element(By.CSS_SELECTOR, "textarea[aria-label='Task description']").send_keys("First draft")
    Select(browser.find_element(By.CSS_SELECTOR, "select[aria-label='Task priority']")).select_by_value("high")
    browser.find_element(By.CSS_SELECTOR, ".task-form button[type='submit']").click()

    wait.until(EC.text_to_be_present_in_element((By.CLASS_NAME, "task-list"), title))

    task_card = browser.find_element(By.XPATH, f"//article[contains(., '{title}')]")
    task_card.find_element(By.CSS_SELECTOR, "button[aria-label='Edit task']").click()
    title_input = task_card.find_element(By.CSS_SELECTOR, "input[aria-label='Edit task title']")
    title_input.clear()
    title_input.send_keys(edited_title)
    task_card.find_element(By.CSS_SELECTOR, "button[aria-label='Save task']").click()

    wait.until(EC.text_to_be_present_in_element((By.CLASS_NAME, "task-list"), edited_title))

    task_card = browser.find_element(By.XPATH, f"//article[contains(., '{edited_title}')]")
    task_card.find_element(By.CSS_SELECTOR, "button[aria-label='Delete task']").click()

    wait.until_not(EC.text_to_be_present_in_element((By.CLASS_NAME, "task-list"), edited_title))
