console.log("JS loaded..")
document.addEventListener("DOMContentLoaded", () => {
    //Defining DOM elements: 

    const buttons_category = document.querySelectorAll(".cgr_btn")
    const buttons = document.querySelectorAll(".check-btn")
    const message = document.querySelector("#message")
    const log_btn = document.querySelector("#log_btn")
    const reg_btn = document.querySelector("#reg_btn")
    const finish_quiz_btn = document.querySelector("#finish_quiz")
    let categoryId = null

    const qaElement = document.querySelector(".q_a")
    if (qaElement) {
        categoryId = qaElement.dataset.categoryId
    }

    
    function getCSRFToken() {
        const name = "csrftoken="
        const decodedCookies = decodeURIComponent(document.cookie)
        const cookies = decodedCookies.split(";")
    
        for (let cookie of cookies) {
            cookie = cookie.trim()
            if (cookie.startsWith(name)) {
                return cookie.substring(name.length)
            }
        }
        return null
    }
    //Q_A FLOW: 
    let score = 0
    
    if (buttons.length > 0) {
        buttons.forEach(button => {
            button.addEventListener("click" , async function(e) {
                console.log("Button was clicked!")
                const q_a_box = e.target.closest(".q_a")
                const data_id = this.dataset.id 
                const response = await fetch(`/kahoot/check_answer/${data_id}/`)
                if (!response.ok) {
                    return console.log("Response not okay..")
                }
                else {
                    const result_box = q_a_box.querySelector(".result")
                    const data = await response.json()
                    result_box.textContent = data.message

                    if (data.correct) {
                        score += data.points
                    }
                }
            })
        })

    }

    if (finish_quiz_btn && categoryId) {
        finish_quiz_btn.addEventListener("click", async () => {
            console.log("Finish clicked")
    
            const csrf = getCSRFToken()
    
            const response = await fetch("/kahoot/save_score/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrf
                },
                body: JSON.stringify({
                    score: score,
                    category: categoryId
                })
            })
        
            if (!response.ok) {
                console.error("Failed to save score")
                return
            }

            const data = await response.json()
            console.log(data)
            document.querySelector(".score").textContent=`Your score is: ${score}`
        })
    }


    if (buttons_category) {
        buttons_category.forEach(button => { 
            button.addEventListener("click" , function(e) {
                const category_id = e.target.dataset.id
                window.location.href = `/kahoot/start_quiz/${category_id}`
            })
        })
    }
    

    //Register FORM handling: 
    if (reg_btn) {
        reg_btn.addEventListener("click" , async(e) => {
            e.preventDefault()

            const reg_username = document.querySelector("#reg_username")
            const reg_password = document.querySelector("#reg_password")
            const csrf = getCSRFToken();

            const response = await fetch("/kahoot/register/", {
                method: "POST",
                headers: {"Content-Type": "application/json" ,"X-CSRFToken": csrf},
                body: JSON.stringify({username: reg_username.value , password:reg_password.value})
            })    
        })
    }

    //Login Form handling: 
    if (log_btn) {
        log_btn.addEventListener("click" , async(e) => {
            e.preventDefault()

            const log_username = document.querySelector("#log_username")
            const log_password = document.querySelector("#log_password")
            const csrf = getCSRFToken();
            

            console.log("Submitting login...");

            const response = await fetch("/kahoot/login/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrf
                },
                body: JSON.stringify({
                username: log_username.value,
                password: log_password.value
                })
            });

            console.log("Response status:", response.status);

            const data = await response.json();
            console.log("Response data:", data);

            if (!response.ok) {
               message.textContent = data.error || data.message;
               return;
            } 
            else {
                if (data.redirect) {
                    window.location.href = data.redirect;
                } else {
                    console.error("Redirect missing:", data);
                }
            }
         })
       }
})