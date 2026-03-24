document.addEventListener("DOMContentLoaded", function () {
    const supmit = document.getElementById('supmit');
    if (supmit) {
        supmit.addEventListener('click', () => {
            let ujKerdes = document.getElementById("ujKerdes").value;
            let joValasz = document.getElementById("jo").value;
            let rosszValasz1 = document.getElementById("rossz1").value;
            let rosszValasz2 = document.getElementById("rossz2").value;
            let rosszValasz3 = document.getElementById("rossz3").value;
            let nehezseg = document.getElementById("nehezseg").value;
            if ([ujKerdes, joValasz, rosszValasz1, rosszValasz2, rosszValasz3].some(v => !v.trim())) {
                alert("Minden mezőt tölts ki!");
                return;
            }
            fetch("/mentes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    kerdes: ujKerdes,
                    jo: joValasz,
                    rossz1: rosszValasz1,
                    rossz2: rosszValasz2,
                    rossz3: rosszValasz3,
                    nehezseg: nehezseg
                })
                })
                .then(res => res.json())
                .then(data => {
                    console.log("Siker:", data);
                })
                .catch(err => {
                    console.error("Hiba:", err);
                });
                });
            }
});