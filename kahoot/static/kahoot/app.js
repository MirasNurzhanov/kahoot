console.log("JS loaded..")
document.addEventListener("DOMContentLoaded", () => {
    //Defining DOM elements: 

    const buttons_category = document.querySelectorAll(".cgr_btn")
    const message = document.querySelector("#message")
    const log_btn = document.querySelector("#log_btn")
    const reg_btn = document.querySelector("#reg_btn")

    
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


    
    // ================= GLOBAL STATE =================
    let questions = []
    let currentQuestionIndex = 0
    let currentCategoryId = null
    let score = 0
    let questionTimer = null


    // ================= SHOW QUESTION =================
    function showQuestion() {
        const container = document.querySelector("#quiz-container")
        container.innerHTML = ""

        const question = questions[currentQuestionIndex]

        const div = document.createElement("div")
        div.classList.add("q_a")

        const questionText = document.createElement("p")
        questionText.textContent = `${currentQuestionIndex + 1}. ${question.text}`
        div.appendChild(questionText)

        question.answers.forEach(answer => {
            const btn = document.createElement("button")
            btn.classList.add("check-btn")
            btn.dataset.id = answer.id
            btn.textContent = answer.text

            div.appendChild(btn)
        })

        container.appendChild(div)
                // clear previous timer
        if (questionTimer) {
            clearTimeout(questionTimer)
        }

        // start new timer (10 seconds)
        questionTimer = setTimeout(() => {
            console.log("Time's up!")

            currentQuestionIndex++

            if (currentQuestionIndex < questions.length) {
                showQuestion()
            } else {
                finishQuiz()
            }

        }, 10000) // 10 sec
    }


    // ================= RENDER QUIZ =================
    function renderQuiz(data) {
        currentCategoryId = data.category_id
        questions = data.questions
        currentQuestionIndex = 0
        score = 0

        showQuestion()
    }


    // ================= FINISH QUIZ =================
    async function finishQuiz() {
        console.log("Finishing quiz...")

        const csrf = getCSRFToken()

        const response = await fetch("/kahoot/save_score/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrf
            },
            body: JSON.stringify({
                score: score,
                category: currentCategoryId
            })
        })

        if (!response.ok) {
            console.error("Failed to save score")
            return
        }

        const container = document.querySelector("#quiz-container")

        container.innerHTML = `
            <h1>🎉 Quiz Finished!</h1>
            <h2>Your final score: ${score}</h2>
            <p>Redirecting to dashboard in 3 seconds...</p>
        `

        setTimeout(() => {
            window.location.href = "/kahoot/dashboard/"
        }, 3000)
    }


    // ================= CLICK HANDLER =================
    document.addEventListener("click", async function(e) {

        // ===== ANSWER CLICK =====
        if (e.target.classList.contains("check-btn")) {
            console.log("Answer clicked")

            const button = e.target
            const q_a_box = button.closest(".q_a")
            const allButtons = q_a_box.querySelectorAll("button")
            const answerId = button.dataset.id
            clearTimeout(questionTimer)

            const response = await fetch("/kahoot/api/check_answer/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken()
                },
                body: JSON.stringify({
                    answer_id: answerId
                })
            })

            if (!response.ok) {
                return console.log("Response not okay..")
            }

            const data = await response.json()

            // ===== UI FEEDBACK =====
            if (data.correct) {
                score += data.points
                button.classList.add("correct")
            } else {
                button.classList.add("incorrect")
            }

            // disable all buttons
            allButtons.forEach(btn => btn.disabled = true)

            console.log("Score:", score)

            // ===== NEXT QUESTION =====
            setTimeout(() => {
                currentQuestionIndex++

                if (currentQuestionIndex < questions.length) {
                    showQuestion()
                } else {
                    finishQuiz()
                }
            }, 800) // small delay for UX
        }
    })

    //QUIZ STARTS HERE 
    if (buttons_category) {
        buttons_category.forEach(button => { 
            button.addEventListener("click", async function(e) {
                const category_id = e.target.dataset.id

                const categoriesBlock = document.querySelector("#categories-block")
                categoriesBlock.style.display = "none"
    
                const response = await fetch("/kahoot/api/start_quiz/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": getCSRFToken()
                    },
                    body: JSON.stringify({ category_id })
                })
    
                const data = await response.json()
                renderQuiz(data)   // 👈 THIS is your “navigation”
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