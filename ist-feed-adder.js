const CDI_II_RSS = `https://cdi2tp.math.tecnico.ulisboa.pt/rss/avisos`;
const CDI_NAME = 'Cálculo Diferencial e Integral II';
let cdi_curricular_unit = {name: CDI_NAME, url: CDI_II_RSS.split('rss')[0], announcements: []};

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

fetch(CDI_II_RSS)
    .then(response => response.text())
    .then(str => new DOMParser().parseFromString(str, "text/xml"))
    .then(data => {
        //populate curricular object
        cdi_curricular_unit.announcements_url = data.getElementsByTagName('link')[0].textContent;
        
        const posts = data.getElementsByTagName('item')
        for (let i = 0; i < posts.length; i++) {
            const element = posts[i];
            cdi_curricular_unit.announcements.push(
                {
                    title: element.getElementsByTagName('title')[0].textContent,
                    date_published: Date.parse(element.getElementsByTagName('pubDate')[0].textContent),
                    last_updated: Date.parse(element.getElementsByTagName('atom:updated')[0].textContent),
                    link: element.getElementsByTagName('link')[0].textContent,
                    html_content: element.getElementsByTagName('description')[0].textContent
                }
            );
        }

        cdi_curricular_unit.announcements.sort((a, b) => b.last_updated - a.last_updated);
        cdi_curricular_unit.last_updated = cdi_curricular_unit.announcements[0].last_updated;

        console.log(cdi_curricular_unit);
    })
    .then( () => {
        //build and apply new html feed
        const newFeed = `
            <div class="panel panel-default" style="border-width: thick;">
                <div class="panel-body clearfix">
                    <h3 class="panel-title pull-left" style="font-size:18px">
                        <strong><a id="colapseToggler" data-toggle="collapse" href="#collapseAnnouncements" aria-expanded="false" aria-controls="collapseAnnouncements">+ </a>
                        <a href="${cdi_curricular_unit.url}">${cdi_curricular_unit.name}</a></strong>
                    </h3>
                    <small class="pull-right">
                        <em>
                            Atualizado em ${formatDate(cdi_curricular_unit.last_updated)}
                        </em>
                    </small>
                </div>

                <div class="collapse" id="collapseAnnouncements">
                    ${cdi_curricular_unit.announcements.map(announcement => `
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
                                            <a href="${cdi_curricular_unit.announcements_url}" target="_blank">
                                                ${cdi_curricular_unit.name} - Anúncios
                                            </a>
                                        </em>
                                        <br>
                                        <em>
                                            Atualizado em ${formatDate(announcement.last_updated)}
                                        </em>
                                    </small>
                                </p>
                            </div>
                        </div>
                    </div>
                    `).join('')}
                </div>
            </div>
        `;

        const contentElement = document.getElementById('main-content-wrapper');
        contentElement.children[0].insertAdjacentHTML("afterend", newFeed);

    })
    .then( () =>{
        //register document events
        let colapseToggler = document.getElementById('colapseToggler');
        console.log(colapseToggler);
        colapseToggler.addEventListener("click", function(){
            console.log('click colapse');
            colapseToggler.innerHTML = (colapseToggler.innerHTML == '+ ') ? '- ' : '+ ' ;
          });
    });