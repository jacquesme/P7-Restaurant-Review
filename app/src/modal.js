var myModal = {

    loadModal: function() {
        myModal.openModal();
        myModal.closeModal();
        myModal.closeModalWindow();
    },
    
    openModal: function() {
        // When the user clicks on the button, open the modal 
        btn.onclick = function() {
            restaurants.closeInfoWindow();
            modal.style.display = "block";
        }
    },
    
    closeModal: function() {
        // When the user clicks on <span> (x), close the modal
        modalClose.onclick = function() {
        modal.style.display = "none";
        }
    },  

    closeModalWindow() {
        // When the user clicks anywhere outside of the modal, close it
        window.onclick = function(event) {
            if (event.target == modal) {
            modal.style.display = "none";
            }
        }
    }  
    
}