let CardrItems = document.querySelectorAll('.card-r');
for (var i = 0; i < CardrItems.length; i++) {
    CardrItems[i].addEventListener('click', function () {
        if (!this.classList.contains('card-r--active')) {
            document.body.style.backgroundColor = `#${this.getAttribute('data-background')}`;
            if (document.querySelector('.card-r--active')) {
                let card_r_active = document.querySelector('.card-r--active')
                card_r_active.classList.remove('card-r--active');
                card_r_active.classList.add('card-r--animate');
            }


            this.classList.add('card-r--active');
            this.classList.add('card-r--animate');
            console.log('变更')
        }
    });
}