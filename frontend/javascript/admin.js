document.addEventListener("DOMContentLoaded", function () {
    const supmit = document.getElementById('supmit');
    if (supmit) {
        supmit.addEventListener('click', () => {
            let ujKerdes = document.getElementById("ujKerdes").value;
            let joValasz = document.getElementById("jo").value
            let rosszValasz1 = document.getElementById("rossz1").value
            let rosszValasz2 = document.getElementById("rossz2").value
            let rosszValasz3 = document.getElementById("rossz3").value
            console.log(ujKerdes);
            console.log(joValasz);
            console.log(rosszValasz1);
            console.log(rosszValasz2);
            console.log(rosszValasz3);
        });
    }
});