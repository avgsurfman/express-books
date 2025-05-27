
//alert("Dziala");

//chadGPT generated
// sends a part of the form that sent the onclick event albeit
// it's 
function button_echo(form) {
    // Find the closest editable divs
    const authorDiv = form.parentElement.querySelector('.AuthorText');
    const titleDiv = form.parentElement.querySelector('.TitleText');

    // Update the hidden inputs
    const hiddenAuthor = form.querySelector('.hidden_author_patch');
    hiddenAuthor.value = authorDiv.innerText.trim();  // take edited text
    // (not chadGPT generated)
    const hiddenTitle = form.querySelector('.hidden_title_patch');
    hiddenTitle.value = titleDiv.innerText.trim();

    console.log("Submitting author and title ", hiddenAuthor.value, hiddenTitle.value);

    // Allow form to actually submit
    return true;
}

class patch_button {
	constructor(hidden_id){
		this.hidden_id = hidden_id;
	}

}





//const btn = document.getElementById("hidden_id_patch");
//btn.addEventListener("click",toggle_visibility);
