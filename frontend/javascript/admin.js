document.addEventListener("DOMContentLoaded", function () {
    const supmit = document.getElementById('supmit');
    if (supmit) {
        supmit.addEventListener('click', () => {
            //???????
            const input = document.getElementById("ujKerdes");
            // shows element
            console.log(input); 
            console.log(input.value);  // shows value
            //???????
            let joValasz = document.getElementById("jo").value
            let rosszValasz1 = document.getElementById("rossz1").value
            let rosszValasz2 = document.getElementById("rossz2").value
            let rosszValasz3 = document.getElementById("rossz3").value
            
            console.log(joValasz);
            console.log(rosszValasz1);
            console.log(rosszValasz2);
            console.log(rosszValasz3);
            location.href = location.href;
        });
    }
});