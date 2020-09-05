    const target = window.location.href
    const queryString = target.split('?')[1];
    let page_num = null;
    
    if(queryString){
        const queries= queryString.split('&');
        
        const page = queries[queries.length - 1];
        // console.log(page);
        if(page.includes('page')){
            page_num= page.split('=')[1];
        }
        else{
            page_num = 1;
        }
    }
    else {
        page_num = 1;
    }
    page_num = parseInt(page_num, 10);
    
    var items = Array.from(document.querySelectorAll('.paginate__num'));
    // console.log(items);

    items.forEach((item, i) => {
        if(i+1 === page_num){
            item.classList.toggle('paginate__active');
            item.childNodes[1].removeAttribute('href');
        }
    });