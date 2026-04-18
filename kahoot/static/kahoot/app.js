console.log("JS loaded..")
document.addEventListener("DOMContentLoaded", () => {

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

    let questions = []
    let currentQuestionIndex = 0
    let currentCategoryId = null
    let score = 0
    let questionTimer = null

    function showQuestion() {
        const container = document.querySelector("#quiz-container")
        container.innerHTML = ""
        const question = questions[currentQuestionIndex]
        const pct = Math.round((currentQuestionIndex / questions.length) * 100)
        container.innerHTML = `
            <div class="quiz-card">
                <div class="quiz-progress-bar">
                    <div class="quiz-progress-fill" style="width:${pct}%"></div>
                </div>
                <div class="quiz-meta">
                    <span class="q-counter">Question ${currentQuestionIndex + 1} / ${questions.length}</span>
                    <span class="score-badge">&#9733; ${score}</span>
                </div>
                <p class="quiz-q-text">${currentQuestionIndex + 1}. ${question.question}</p>
                <div class="quiz-answers" id="answers-box"></div>
            </div>`
        const answersBox = container.querySelector("#answers-box")
        question.answers.forEach(answer => {
            const btn = document.createElement("button")
            btn.classList.add("answer-btn")
            btn.dataset.id = answer.id
            btn.textContent = answer.text
            answersBox.appendChild(btn)
        })
        if (questionTimer) clearTimeout(questionTimer)
        questionTimer = setTimeout(() => {
            currentQuestionIndex++
            if (currentQuestionIndex < questions.length) showQuestion()
            else finishQuiz()
        }, 10000)
    }

    function renderQuiz(data) {
        currentCategoryId = data.category_id
        questions = data.questions
        currentQuestionIndex = 0
        score = 0
        showQuestion()
    }

    async function finishQuiz() {
        const csrf = getCSRFToken()
        const response = await fetch("/kahoot/save_score/", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRFToken": csrf },
            body: JSON.stringify({ score: score, category_id: currentCategoryId })
        })
        if (!response.ok) console.error("Failed to save score")
        const container = document.querySelector("#quiz-container")
        container.innerHTML = `
            <div class="quiz-card quiz-result">
                <h2>&#127942; Quiz Complete!</h2>
                <span class="final-score">${score} / ${questions.length}</span>
                <p style="color:var(--text-dim); margin-bottom:1.5rem;">
                    ${score === questions.length ? 'Perfect score! You are a galaxy brain.' :
                      score >= questions.length * 0.7 ? 'Great job, space explorer!' : 'Keep training, cadet!'}
                </p>
                <div style="display:flex; gap:1rem; justify-content:center; flex-wrap:wrap;">
                    <button class="btn btn-primary" onclick="location.reload()">&#9654; Play Again</button>
                    <a href="/kahoot/leaderboard/" class="btn btn-ghost">&#127942; Leaderboard</a>
                </div>
            </div>`
    }

    document.addEventListener("click", async function(e) {
        if (e.target.classList.contains("answer-btn")) {
            const button = e.target
            const allButtons = document.querySelectorAll(".answer-btn")
            const answerId = button.dataset.id
            clearTimeout(questionTimer)
            allButtons.forEach(btn => btn.disabled = true)
            const response = await fetch("/kahoot/api/check_answer/", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-CSRFToken": getCSRFToken() },
                body: JSON.stringify({ answer_id: answerId })
            })
            if (!response.ok) return console.log("Response not okay..")
            const data = await response.json()
            if (data.correct) {
                score += data.points
                button.classList.add("correct")
            } else {
                button.classList.add("wrong")
                allButtons.forEach(btn => {
                    if (btn.dataset.id == data.correct_id) btn.classList.add("correct")
                })
            }
            setTimeout(() => {
                currentQuestionIndex++
                if (currentQuestionIndex < questions.length) showQuestion()
                else finishQuiz()
            }, 800)
        }
    })

    if (buttons_category.length > 0) {
        buttons_category.forEach(button => {
            button.addEventListener("click", async function() {
                const category_id = button.dataset.id
                const categoriesBlock = document.querySelector("#categories-block")
                if (categoriesBlock) categoriesBlock.style.display = "none"
                const quizContainer = document.querySelector("#quiz-container")
                quizContainer.innerHTML = `
                    <div class="quiz-card" style="text-align:center; padding:3rem;">
                        <div style="font-size:2rem;">&#9733;</div>
                        <p style="margin-top:1rem; color:var(--text-dim);">Loading questions…</p>
                    </div>`
                const response = await fetch(`/kahoot/api/start_quiz/?category_id=${category_id}`, {
                    method: "GET"
                })
                const data = await response.json()
                renderQuiz(data)
            })
        })
    }

    if (reg_btn) {
        reg_btn.addEventListener("click", async (e) => {
            e.preventDefault()
            const username = document.querySelector("#reg_username").value.trim()
            const password = document.querySelector("#reg_password").value
            const response = await fetch("/kahoot/register/", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded", "X-CSRFToken": getCSRFToken() },
                body: new URLSearchParams({ username, password })
            })
            const data = await response.json()
            if (data.success) window.location.href = "/kahoot/dashboard/"
            else {
                const msg = document.querySelector("#reg-msg")
                if (msg) msg.innerHTML = `<div class="alert alert-error">${data.message}</div>`
            }
        })
    }

    if (log_btn) {
        log_btn.addEventListener("click", async (e) => {
            e.preventDefault()
            const username = document.querySelector("#log_username").value.trim()
            const password = document.querySelector("#log_password").value
            const response = await fetch("/kahoot/login/", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded", "X-CSRFToken": getCSRFToken() },
                body: new URLSearchParams({ username, password })
            })
            const data = await response.json()
            if (data.success) window.location.href = "/kahoot/dashboard/"
            else {
                const msg = document.querySelector("#message")
                if (msg) msg.innerHTML = `<div class="alert alert-error">${data.message}</div>`
            }
        })
    }
})