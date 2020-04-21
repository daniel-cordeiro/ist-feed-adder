const FEED_CONTENT_ELEMENT = document.getElementById('main-content-wrapper');

//inject input fields
const newFeedInput = `
<button id="btnShowAddFeedPanel" type="button" style="margin-bottom:18px" class="btn btn-link" data-toggle="collapse" data-target="#newFeedInputPanel">Adicionar Feed</button>
<div class="panel panel-default collapse" id="newFeedInputPanel">
    <div class="panel-body">
        <form id="formNewFeed">
            <div class="form-group">
                <label for="curricular_unit_name">Nome da disciplina:</label>
                <input type="text" class="form-control" id="curricular_unit_name" required>
            </div>
            <div class="form-group">
                <label for="rss_url">URL do feed RSS:</label>
                <input class="form-control" id="rss_url" type="url" required>
            </div>
            <button id="submitNewFeed" type="submit" class="btn btn-primary">Submeter</button>
        </form>
    </div>
</div>
`;
FEED_CONTENT_ELEMENT.children[0].insertAdjacentHTML("afterend", newFeedInput);


function submitNewFeed(event) {
    event.preventDefault();

    const curricular_unit_name = document.getElementById('curricular_unit_name').value;
    const rss_url = document.getElementById('rss_url').value;
    
    console.log(curricular_unit_name);
    console.log(rss_url);


    addCurricularUnit(curricular_unit_name,rss_url)
    .then(() =>{
        formNewFeed.reset();
        document.getElementById('btnShowAddFeedPanel').click();
    })
    .catch((err) =>{
        alert("O feed RSS que especificou não existe ou é inválido.");
        console.log(err);
    });  
}


//register submit event
const formNewFeed = document.getElementById('formNewFeed');
formNewFeed.addEventListener('submit', submitNewFeed);



function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [day, month, year].join('-');
}


function addCurricularUnit(name, rssUrl) {
    // const CDI_II_RSS = `https://cdi2tp.math.tecnico.ulisboa.pt/rss/avisos`;
    // const CDI_NAME = 'Cálculo Diferencial e Integral II';
    const CU_NAME = name;
    const CU_RSS = rssUrl;
    const curricular_unit = {name: CU_NAME, url: CU_RSS.split('rss')[0], announcements: []};

    //parses rss and returns a promise
    return fetch(CU_RSS)
        .then(response => response.text())
        .then(str => new DOMParser().parseFromString(str, "text/xml"))
        .then(data => {
            //populate curricular object
            curricular_unit.announcements_url = data.getElementsByTagName('link')[0].textContent;
            
            const posts = data.getElementsByTagName('item')
            for (let i = 0; i < posts.length; i++) {
                const element = posts[i];
                curricular_unit.announcements.push(
                    {
                        title: element.getElementsByTagName('title')[0].textContent,
                        date_published: Date.parse(element.getElementsByTagName('pubDate')[0].textContent),
                        last_updated: 
                            element.getElementsByTagName('atom:updated').length == 0 ? 
                            Date.parse(element.getElementsByTagName('pubDate')[0].textContent) :
                            Date.parse(element.getElementsByTagName('atom:updated')[0].textContent),
                        link: element.getElementsByTagName('link')[0].textContent,
                        html_content: element.getElementsByTagName('description')[0].textContent
                    }
                );
            }

            curricular_unit.announcements.sort((a, b) => b.last_updated - a.last_updated);
            curricular_unit.last_updated = curricular_unit.announcements[0].last_updated;

            console.log(curricular_unit);
        })
        .then( () => {
            //build and apply new html feed
            const ts = Date.now();

            const newFeed = `
                <div class="panel panel-default" style="border-width: thick;">
                    <div class="panel-body clearfix">
                        <h3 class="panel-title pull-left" style="font-size:18px">
                            <strong><a id="colapseToggler-${ts}" data-toggle="collapse" href="#collapseAnnouncements-${ts}">+ </a>
                            <a href="${curricular_unit.url}">${curricular_unit.name}</a></strong>
                        </h3>
                        <small class="pull-right">
                            <em>
                                Atualizado em ${formatDate(curricular_unit.last_updated)}
                            </em>
                        </small>
                    </div>

                    <div class="collapse" id="collapseAnnouncements-${ts}">
                        ${curricular_unit.announcements.map(announcement => `
                        <div class="panel-body">
                            <div class="panel panel-default">
                                <div class="panel-body clearfix">
                                    <h3 class="panel-title pull-left">
                                        <strong><a href="${announcement.link}">${announcement.title}</a></strong>
                                    </h3>
                                    <small class="pull-right">
                                        <em>
                                            Publicado em ${formatDate(announcement.date_published)}
                                        </em>
                                    </small>
                                </div>
                                <div class="panel-body">
                                    <div>
                                        ${announcement.html_content}
                                    </div>
                                    <p class="text-right" style="margin: 0">
                                        <small>
                                            <em>
                                                <a href="${curricular_unit.announcements_url}" target="_blank">
                                                    ${curricular_unit.name} - Anúncios
                                                </a>
                                            </em>
                                            ${announcement.last_updated == announcement.date_published ? `` : 
                                            `<br>
                                            <em>
                                                Atualizado em ${formatDate(announcement.last_updated)}
                                            </em>`}
                                        </small>
                                    </p>
                                </div>
                            </div>
                        </div>
                        `).join('')}
                    </div>
                </div>
            `;

            FEED_CONTENT_ELEMENT.children[2].insertAdjacentHTML("afterend", newFeed);
            return ts;

        })
        .then( ts =>{
            //register document events
            let colapseToggler = document.getElementById(`colapseToggler-${ts}`);
            console.log(colapseToggler);
            colapseToggler.addEventListener("click", function(){
                console.log('click colapse');
                colapseToggler.innerHTML = (colapseToggler.innerHTML == '+ ') ? '- ' : '+ ' ;
            });
        });
}