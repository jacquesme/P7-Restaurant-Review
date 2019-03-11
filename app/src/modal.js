var myModal = {

    btn: document.getElementById("iw-reviews"),
    modal: document.getElementById('myModal'),
    modalClose: document.getElementById('modal-close'),

    loadModal: function() {
        myModal.openModal();
        myModal.closeModal();
        myModal.closeModalWindow();
    },
    
    openModal: function() {
        // When the user clicks on the button, open the modal 
        myModal.btn.onclick = function() {
            Gmap.closeInfoWindow();
            myModal.modal.style.display = "block";
        }
    },
    
    closeModal: function() {
        // When the user clicks on <span> (x), close the modal
        myModal.modalClose.onclick = function() {
        myModal.modal.style.display = "none";
        }
    },  

    closeModalWindow() {
        // When the user clicks anywhere outside of the modal, close it
        window.onclick = function(event) {
            if (event.target == myModal.modal) {
            myModal.modal.style.display = "none";
            }
        }
    }  
    
}