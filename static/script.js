const buttons = document.querySelectorAll("[data-button]")

let lastClickTime = 0
let lastSubmitTime = 0

function clickHandler(event) {
    const time = new Date().getTime() / 1000.0;
    if (time - lastClickTime < 0.2) return
    lastClickTime = time

    const button = event.target
    button.classList.add("clicked")
    setTimeout(() => {
        button.classList.remove("clicked")
    }, 200)

    if (time - lastSubmitTime > 1.0) {
        lastSubmitTime = time
        const params = new URLSearchParams(window.location.search)
        const body = {
            buttonId: button.getAttribute("data-button"),
            location: params.get("location") ?? "unknown",
        }
        fetch("/api/press", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        })
    }
}

for (const button of buttons) {
    button.addEventListener("click", clickHandler)
}
