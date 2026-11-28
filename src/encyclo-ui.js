/* ---------- Encyclopédie conversationnelle (tout est dans la page : fonctionne hors ligne) ---------- */
var FICHE={};ENC.forEach(function(e){FICHE[e.id]=e});
var STOP=" le la les l un une des de du d qu que qui quoi quel quelle quels quelles est ce c cet cette ces et ou a au aux en dans pour par sur avec sans se s sa son ses mon ma mes ton ta tes il elle on nous vous ils elles je j me m te t y ne n pas plus moins tres comment pourquoi explique expliquez expliquer moi dis dites parle parlez parler peux pouvez tu veux voudrais savoir chez selon definition definir signifie veut dire notion concept theorie idee idees pensee qu est c est etait sont ont fait faire bien alors donc aussi encore tout tous toute toutes son leur leurs lui eux ca cela ceci quoi role sens vrai vraiment ";
function norm(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/œ/g,"oe").replace(/æ/g,"ae").replace(/[^a-z0-9]+/g," ").trim()}
function mots(s){return norm(s).split(" ").filter(function(w){return w.length>1&&STOP.indexOf(" "+w+" ")<0})}
var CLES=ENC.map(function(e){
  var t=norm(e.t).replace(/^(le|la|les|l)\s+/,"");
  var cles=[t,norm(e.id.replace(/_/g," "))].concat((e.al||[]).map(norm)).filter(function(k,i,arr){return arr.indexOf(k)===i});
  var bag={};cles.forEach(function(k){k.split(" ").forEach(function(w){if(w.length>2&&STOP.indexOf(" "+w+" ")<0)bag[w]=1})});
  var corps={};mots(e.r).forEach(function(w){if(w.length>3)corps[w]=1});
  return {e:e,cles:cles,bag:bag,corps:corps};
});
function scorer(q){
  var qn=" "+norm(q)+" ",qm=mots(q),res=[];
  CLES.forEach(function(c){
    var s=0;
    c.cles.forEach(function(k){if(k.length>=3&&qn.indexOf(" "+k+" ")>=0)s+=20+k.length});
    qm.forEach(function(w){
      if(w.length<3)return;
      if(c.bag[w])s+=4;
      else if(w.length>=5)for(var b in c.bag){if(b.length>=5&&(b.indexOf(w)===0||w.indexOf(b)===0)){s+=2;break}}
      if(c.corps[w])s+=1;
    });
    if(s>0)res.push({id:c.e.id,s:s});
  });
  return res.sort(function(a,b){return b.s-a.s});
}
var RE_COMP=/\b(compar\w*|difference\w*|distingu\w*|oppos\w*|versus|vs|rapport entre|lien entre|point commun|points communs)\b/;
function chercherCitation(q){
  var qm=mots(q.replace(/qui a (dit|ecrit)|de qui est|d ou vient|source de|citation/gi," ")),best=null;
  if(qm.length<2)return null;
  ENC.forEach(function(e){(e.cit||[]).forEach(function(c,i){
    var cm=mots(c[0]),n=0;qm.forEach(function(w){if(cm.indexOf(w)>=0)n++});
    var s=n/Math.max(3,qm.length);if(n>=2&&s>=.5&&(!best||s>best.s))best={id:e.id,i:i,s:s};
  })});
  return best;
}
function repondre(q){
  var qn=norm(q);
  if(/^(auteurs?|notions?|sommaire|index|liste|tout|toutes les fiches|que sais tu|que connais tu)( des?( auteurs| notions| fiches))?$/.test(qn))return {t:"index"};
  if(/qui a (dit|ecrit)|de qui est|d ou vient (la|cette) (phrase|citation|formule)|citation/.test(qn)){var c=chercherCitation(q);if(c)return {t:"cit",id:c.id,i:c.i}}
  if(RE_COMP.test(qn)||/\bet\b.*\b(chez|selon)\b|\b(chez|selon)\b.*\bet\b/.test(qn)){
    var parts=qn.replace(RE_COMP," ").split(/\bet chez\b|\bet\b|\bavec\b|\bcontre\b|\bversus\b|\bvs\b|,|\bou\b/).filter(function(p){return mots(p).length});
    var pris=[];
    parts.forEach(function(p){var r=scorer(p);for(var i=0;i<r.length;i++){if(r[i].s>=8&&pris.indexOf(r[i].id)<0){pris.push(r[i].id);break}}});
    if(pris.length>=2)return {t:"comp",a:pris[0],b:pris[1]};
  }
  var r=scorer(q);
  if(!r.length||r[0].s<8)return {t:"rien",sugg:r.slice(0,3).map(function(x){return x.id})};
  var aussi=r.slice(1,4).filter(function(x){return x.s>=Math.max(8,r[0].s*.6)}).map(function(x){return x.id});
  return {t:"fiche",id:r[0].id,aussi:aussi};
}

var GENRE={a:"Auteur",n:"Notion",c:"Courant"};
function kicker(e){return '<span class="eyebrow">'+(e.d==="psy"?"Psychanalyse":"Philosophie")+' · '+GENRE[e.k]+(e.dt?' · '+esc(e.dt):'')+'</span>'}
function gardePsy(e){return e.d==="psy"?'<p class="garde-psy">Ces notions servent à comprendre, pas à se diagnostiquer ni à juger les autres. Si vous souffrez, parlez-en à un médecin, un psychologue ou un psychiatre (en cas de détresse : 3114).</p>':''}
function listeHTML(t,arr){return arr&&arr.length?'<h4>'+t+'</h4><ul class="enc-liste">'+arr.map(function(x){return'<li>'+esc(x)+'</li>'}).join("")+'</ul>':''}
function citsHTML(e){return e.cit&&e.cit.length?'<h4>Formules célèbres, avec leur source</h4>'+e.cit.map(function(c){return'<blockquote class="enc-cit">« '+esc(c[0])+' »<cite>'+esc(c[1])+'</cite></blockquote>'}).join(""):''}
function lienFiche(id,txt,q){var f=FICHE[id];return f?'<button type="button" class="chip" data-dem="'+id+'" data-q="'+esc(q||(txt&&txt.indexOf("Et ")===0?txt:f.t))+'">'+esc(txt||f.t)+'</button>':''}
function corpsFiche(e){
  return e.p.slice(1).map(function(x){return'<p>'+esc(x)+'</p>'}).join("")+
   listeHTML("Thèses clés",e.th)+
   (e.ob?'<h4>Débats et objections</h4><p>'+esc(e.ob)+'</p>':'')+
   citsHTML(e)+
   listeHTML("Œuvres à lire",e.oe)+
   listeHTML("Pour aller plus loin",e.sec)+
   (e.qd&&e.qd.length?'<h4>Sujets de réflexion</h4><ul class="enc-liste">'+e.qd.map(function(x){return'<li><em>'+esc(x)+'</em></li>'}).join("")+'</ul>':'');
}
/* Demande prête pour une IA : au second plan, jamais une IA présélectionnée */
var DEMANDES={},nDem=0;
function demandeIA(sujet,psy,extra){
  return "Tu es professeur de philosophie"+(psy?" et de psychanalyse":"")+" à l'université, niveau master, exigeant et clair.\nSujet : "+sujet+"\n"+(extra?extra+"\n":"")+
   "1. Expose précisément la pensée ou la notion, avec les concepts clés et leur définition.\n2. Situe-la dans l'histoire des idées et confronte-la à au moins deux auteurs qui la discutent.\n3. Donne des références exactes (œuvre, chapitre ou paragraphe). N'invente aucune citation : si tu n'es pas sûr d'une formule ou d'une date, dis-le.\n"+
   (psy?"4. Reste sur le plan théorique : ne pose aucun diagnostic sur moi ni sur personne.\n5.":"4.")+" Termine par une question pour vérifier que j'ai compris, puis attends ma réponse.";
}
function blocIA(txt){
  var k="d"+(++nDem);DEMANDES[k]=txt;
  return '<details class="enc-ia"><summary>Approfondir avec une IA (facultatif)</summary><div class="stack" style="gap:10px;margin-top:10px">'+
   '<p class="doux petit">Alfred prépare une demande exigeante. Choisissez l\'IA que vous voulez : la demande est copiée, collez-la si la page s\'ouvre vide. Vérifiez toujours les références qu\'elle donne.</p>'+
   '<div class="demande">'+esc(txt)+'</div>'+
   '<div class="petits-ia">'+["claude","lechat","chatgpt","gemini","perplexity"].map(function(id){var a=byId[id];return a?'<a class="petit-ia" href="'+lienIA(a,txt)+'" target="_blank" rel="noopener" data-essai="'+id+'" data-dem-ia="'+k+'">'+esc(a.nom)+'</a>':''}).join("")+'</div>'+
   '<p class="doux petit">Le Chat (Mistral) est européen. <a href="#guide">Comparer les IA gratuites</a></p></div></details>';
}
function carteCourte(e,aussi){
  lu(e.id);
  var liens=(e.l||[]).filter(function(x){return FICHE[x]}).slice(0,5);
  var comp=(e.l||[]).filter(function(x){return FICHE[x]&&FICHE[x].k===e.k})[0];
  return kicker(e)+'<h3>'+esc(e.t)+'</h3><p class="enc-r">'+esc(e.r)+'</p><p>'+esc(e.p[0])+'</p>'+
   '<details class="enc-plus"><summary>Développer la réponse</summary><div class="stack" style="gap:12px;margin-top:10px">'+corpsFiche(e)+'</div></details>'+
   gardePsy(e)+
   '<div class="enc-suite"><span class="doux petit">Continuer :</span>'+liens.map(function(x){return lienFiche(x,"Et "+nomCourt(FICHE[x])+" ?")}).join("")+
   (comp?'<button type="button" class="chip" data-comp="'+e.id+'-'+comp+'">Comparer avec '+esc(FICHE[comp].t)+'</button>':'')+
   (aussi&&aussi.length?aussi.map(function(x){return lienFiche(x,"Voir aussi : "+FICHE[x].t)}).join(""):'')+
   '<a class="chip" href="#fiche-'+e.id+'">Fiche complète</a></div>'+
   blocIA(demandeIA(e.t+(e.dt?" ("+e.dt+")":""),e.d==="psy"));
}
function nomCourt(f){return f.k==="a"?f.t:f.t.charAt(0).toLowerCase()+f.t.slice(1)}
function communs(a,b){var la=a.l||[],lb=b.l||[];return la.filter(function(x){return lb.indexOf(x)>=0&&FICHE[x]})}
function carteComparer(a,b){
  lu(a.id);lu(b.id);
  var com=communs(a,b),direct=(a.l||[]).indexOf(b.id)>=0||(b.l||[]).indexOf(a.id)>=0;
  function col(e){return '<div class="enc-col">'+kicker(e)+'<h3>'+esc(e.t)+'</h3><p>'+esc(e.r)+'</p>'+listeHTML("Thèses clés",e.th)+(e.oe&&e.oe.length?'<p class="doux petit"><strong>À lire :</strong> '+esc(e.oe.slice(0,3).join(" ; "))+'</p>':'')+'</div>'}
  return '<span class="eyebrow">Comparaison</span><h3>'+esc(a.t)+' et '+esc(b.t)+'</h3>'+
   '<div class="enc-comp">'+col(a)+col(b)+'</div>'+
   '<h4>Ce qui les relie</h4><p>'+(direct?'Les deux fiches se renvoient l\'une à l\'autre : '+esc(a.t)+' et '+esc(b.t)+' discutent directement les mêmes questions (voir les débats de chaque fiche). ':'')+
   (com.length?'Questions et auteurs en commun : '+com.map(function(x){return esc(FICHE[x].t)}).join(", ")+'.':(direct?'':'Alfred ne relève pas de lien direct entre ces deux fiches : la comparaison porte sur deux manières différentes de poser les problèmes.'))+'</p>'+
   '<h4>Pour faire travailler la comparaison</h4><ul class="enc-liste"><li>Quelle question chacun pose-t-il, et à quoi s\'oppose-t-il ?</li><li>Quelle conception du sujet, de la liberté ou du désir est en jeu de chaque côté ?</li><li>Lequel répond le mieux à l\'objection principale de l\'autre ?</li></ul>'+
   ((a.d==="psy"||b.d==="psy")?gardePsy({d:"psy"}):'')+
   '<div class="enc-suite"><span class="doux petit">Continuer :</span>'+lienFiche(a.id,"Approfondir "+a.t)+lienFiche(b.id,"Approfondir "+b.t)+com.slice(0,3).map(function(x){return lienFiche(x,"Et "+nomCourt(FICHE[x])+" ?")}).join("")+'</div>'+
   blocIA(demandeIA("comparer "+a.t+" et "+b.t,a.d==="psy"||b.d==="psy","Fais une comparaison rigoureuse : points d'accord, désaccords, concepts qui ne se recouvrent pas, et ce que chacun aurait à objecter à l'autre."));
}
function carteRien(q,sugg){
  return '<span class="eyebrow">Alfred cherche</span><p>Je n\'ai pas encore de fiche qui réponde précisément à « '+esc(q)+' ». Je préfère vous le dire plutôt que d\'improviser.</p>'+
   (sugg.length?'<p>Ce qui s\'en approche dans l\'encyclopédie :</p><div class="enc-suite">'+sugg.map(function(x){return lienFiche(x)}).join("")+'</div>':'<p>Essayez avec le nom d\'un auteur (Spinoza, Freud…) ou d\'une notion (le désir, le transfert…), ou <a href="#index">parcourez l\'encyclopédie</a>.</p>')+
   blocIA(demandeIA(q,true));
}
function carteCit(e,i){
  var c=e.cit[i];lu(e.id);
  return '<span class="eyebrow">Citation</span><blockquote class="enc-cit">« '+esc(c[0])+' »<cite>'+esc(c[1])+'</cite></blockquote><p>Cette formule appartient à la fiche <strong>'+esc(e.t)+'</strong>. '+esc(e.r)+'</p><div class="enc-suite">'+lienFiche(e.id,"Lire la fiche "+e.t)+'</div>';
}
function carteIndex(){return '<span class="eyebrow">Le sommaire</span><p>L\'encyclopédie compte '+ENC.length+' fiches : '+ENC.filter(function(e){return e.d==="philo"}).length+' de philosophie et '+ENC.filter(function(e){return e.d==="psy"}).length+' de psychanalyse.</p><div class="row"><a class="btn sec" href="#index">Parcourir le sommaire</a><a class="btn sec" href="#frise">Voir la frise des auteurs</a></div>'}
function rendreTour(t){
  var r=t.r,h;
  if(r.t==="fiche"&&FICHE[r.id])h=carteCourte(FICHE[r.id],r.aussi);
  else if(r.t==="comp"&&FICHE[r.a]&&FICHE[r.b])h=carteComparer(FICHE[r.a],FICHE[r.b]);
  else if(r.t==="cit"&&FICHE[r.id]&&FICHE[r.id].cit&&FICHE[r.id].cit[r.i])h=carteCit(FICHE[r.id],r.i);
  else if(r.t==="index")h=carteIndex();
  else h=carteRien(t.q,(r.sugg||[]).filter(function(x){return FICHE[x]}));
  return '<div class="bulle-q"><span>'+esc(t.q)+'</span></div><article class="bulle-r stack" style="gap:12px">'+h+'</article>';
}
function lu(id){S.lues=S.lues||{};if(!S.lues[id]){S.lues[id]=1;sauver()}}
var EXEMPLES=["Qu'est-ce que le conatus ?","Compare Freud et Jung","Qui a dit « l'enfer, c'est les autres » ?","Le stade du miroir","La banalité du mal","Hegel : le maître et l'esclave","Winnicott et l'objet transitionnel","Le désir chez Spinoza et chez Lacan","La pulsion de mort","Kant et l'impératif catégorique","Différence entre Platon et Aristote","Le transfert","Qu'est-ce que le nihilisme ?","Deuil et mélancolie","La psychanalyse est-elle une science ?","Le temps selon Augustin"];
function exemples(){var d=new Date().getDate(),out=[];for(var i=0;i<5;i++)out.push(EXEMPLES[(d*5+i)%EXEMPLES.length]);return out}
function poser(q,rep){
  q=String(q||"").trim();if(!q)return;
  if(detresse(q)){vCrise();return}
  S.conv=S.conv||[];S.conv.push({q:q,r:rep||repondre(q)});if(S.conv.length>30)S.conv=S.conv.slice(-30);sauver();
  var fil=document.getElementById("fil");
  if(!fil||location.hash.replace("#","")!=="accueil"&&location.hash!==""){location.hash="accueil";return}
  var div=document.createElement("div");div.className="tour stack";div.style.gap="10px";div.innerHTML=rendreTour(S.conv[S.conv.length-1]);
  var vide=document.getElementById("fil-vide");if(vide)vide.remove();
  fil.appendChild(div);
  var inp=document.getElementById("question");if(inp)inp.value="";
  div.scrollIntoView({behavior:"smooth",block:"start"});
}
function vEncyclo(){
  var conv=S.conv||[],nl=Object.keys(S.lues||{}).length;
  vue.innerHTML='<div class="stack">'+
   '<div class="feuille cahier stack" style="gap:10px"><span class="eyebrow">Encyclopédie de philosophie et de psychanalyse</span>'+
    '<p class="principe">Posez votre question à Alfred, comme à un professeur.</p>'+
    '<p class="doux">'+ENC.length+' fiches de niveau master : auteurs, courants et notions, de Socrate à Lacan, avec leurs thèses, leurs débats, les œuvres à lire et des sujets de réflexion. Tout est dans l\'appli, même sans internet.'+(nl?' Vous avez déjà ouvert '+nl+' fiche'+(nl>1?'s':'')+'.':'')+'</p>'+
    '<div class="row"><a class="btn sec" href="#index">Sommaire</a><a class="btn sec" href="#frise">Frise des auteurs</a></div></div>'+
   '<div id="fil" class="stack" aria-live="polite">'+(conv.length?conv.map(function(t){return'<div class="tour stack" style="gap:10px">'+rendreTour(t)+'</div>'}).join(""):'<p id="fil-vide" class="doux">Par exemple :</p>')+'</div>'+
   '<form id="form-q" class="enc-form" autocomplete="off"><label for="question" class="visuel-cache">Votre question</label><input id="question" type="text" enterkeyhint="send" placeholder="Posez votre question…"><button class="btn" type="submit">Demander</button></form>'+
   '<p class="doux petit" style="margin-top:-6px">Un auteur, une notion, « compare Freud et Jung », « qui a dit… ? »</p><div class="idees">'+exemples().map(function(x){return'<button type="button" class="chip" data-ex="'+esc(x)+'">'+esc(x)+'</button>'}).join("")+'</div>'+
   (conv.length?'<p class="petit"><button type="button" class="mini" id="effacer-conv">Effacer la conversation</button></p>':'')+
   '<section class="stack" style="gap:12px;margin-top:18px"><h2 style="font-size:1.25rem">Et aussi : bien choisir et utiliser les IA gratuites</h2>'+
   '<div class="portes">'+
     '<a class="porte" href="#reflechir"><strong>Réfléchir avec Alfred</strong><span class="doux">Les outils de Socrate pour voir clair, et dix grands textes commentés.</span></a>'+
     '<a class="porte" href="#orienter"><strong>Quelle IA pour mon besoin ?</strong><span class="doux">Décrivez ce que vous voulez faire : Alfred conseille 3 IA et prépare votre demande.</span></a>'+
     '<a class="porte" href="#guide"><strong>Guide des IA gratuites</strong><span class="doux">'+IA.length+' IA expliquées : ce qu\'elles font bien et ce qu\'elles font de vos données.</span></a>'+
     '<a class="porte" href="#parcours"><strong>Leçons</strong><span class="doux">'+LECONS.length+' leçons pour bien démarrer, et '+HORIZON.reduce(function(a,d){return a+d.x.length},0)+' idées d\'usages.</span></a>'+
   '</div></section></div>';
  if(conv.length){var t=document.querySelectorAll("#fil .tour");if(t.length)t[t.length-1].scrollIntoView({block:"start"})}
}
function vFiche(id){
  var e=FICHE[id];if(!e){location.hash="index";return}
  lu(id);
  vue.innerHTML='<div class="stack"><a href="#accueil" class="petit">← Revenir à la conversation</a>'+
   '<article class="feuille cahier stack" style="gap:12px">'+kicker(e)+'<h2>'+esc(e.t)+'</h2><p class="enc-r">'+esc(e.r)+'</p><p>'+esc(e.p[0])+'</p>'+corpsFiche(e)+gardePsy(e)+'</article>'+
   '<div class="enc-suite"><span class="doux petit">Fiches liées :</span>'+(e.l||[]).filter(function(x){return FICHE[x]}).map(function(x){return'<a class="chip" href="#fiche-'+x+'">'+esc(FICHE[x].t)+'</a>'}).join("")+'</div>'+
   '<div class="row"><button type="button" class="btn sec" data-dem="'+e.id+'" data-q="'+esc(e.t)+'">Ajouter à ma conversation avec Alfred</button></div>'+
   blocIA(demandeIA(e.t+(e.dt?" ("+e.dt+")":""),e.d==="psy"))+'</div>';
  window.scrollTo(0,0);
}
function vComparer(a,b){
  if(!FICHE[a]||!FICHE[b]){location.hash="accueil";return}
  vue.innerHTML='<div class="stack"><a href="#accueil" class="petit">← Revenir à la conversation</a><article class="feuille stack" style="gap:12px">'+carteComparer(FICHE[a],FICHE[b])+'</article></div>';
}
var GROUPES=[["philo","a","Philosophie · Auteurs"],["philo","c","Philosophie · Courants"],["philo","n","Philosophie · Notions"],["psy","a","Psychanalyse · Auteurs"],["psy","n","Psychanalyse · Notions"]];
function vIndex(){
  vue.innerHTML='<div class="stack"><a href="#accueil" class="petit">← Revenir à la conversation</a><h2>Sommaire de l\'encyclopédie</h2>'+
   '<input id="filtre-enc" class="enc-filtre" type="search" placeholder="Filtrer : Kant, désir, inconscient…" aria-label="Filtrer les fiches">'+
   GROUPES.map(function(g){var l=ENC.filter(function(e){return e.d===g[0]&&e.k===g[1]}).sort(function(x,y){return x.t.localeCompare(y.t,"fr")});
     return '<section class="stack enc-groupe" style="gap:8px"><h3>'+g[2]+' <span class="doux petit">('+l.length+')</span></h3><div class="enc-index">'+l.map(function(e){return'<a href="#fiche-'+e.id+'" data-nom="'+esc(norm(e.t+" "+(e.al||[]).join(" ")))+'"'+((S.lues||{})[e.id]?' class="lu"':'')+'>'+esc(e.t)+(e.dt&&e.k==="a"?' <span class="doux petit">'+esc(e.dt)+'</span>':'')+'</a>'}).join("")+'</div></section>'}).join("")+'</div>';
  var f=document.getElementById("filtre-enc");
  f.addEventListener("input",function(){var v=norm(f.value);document.querySelectorAll(".enc-index a").forEach(function(a){a.hidden=v&&a.dataset.nom.indexOf(v)<0});document.querySelectorAll(".enc-groupe").forEach(function(s){s.hidden=!s.querySelector(".enc-index a:not([hidden])")})});
  window.scrollTo(0,0);
}
var ROMAIN={15:"XVe",16:"XVIe",17:"XVIIe",18:"XVIIIe",19:"XIXe",20:"XXe"};
function annee(dt){var m=/(\d{3,4})/.exec(dt||"");if(!m)return 9999;var y=+m[1];return /av\. J\.-C\./.test(dt)?-y:y}
function vFrise(){
  var l=ENC.filter(function(e){return e.k==="a"}).sort(function(a,b){return annee(a.dt)-annee(b.dt)}),siecle=null,h="";
  l.forEach(function(e){var y=annee(e.dt),s=y<0?"Antiquité grecque":y<500?"Antiquité tardive":y<1400?"Moyen Âge":(ROMAIN[Math.floor(y/100)+1]||"")+" siècle";
    if(s!==siecle){siecle=s;h+='<li class="frise-siecle">'+esc(s)+'</li>'}
    h+='<li><a href="#fiche-'+e.id+'"><strong>'+esc(e.t)+'</strong> <span class="doux petit">'+esc(e.dt)+' · '+(e.d==="psy"?"psychanalyse":"philosophie")+'</span></a></li>'});
  vue.innerHTML='<div class="stack"><a href="#accueil" class="petit">← Revenir à la conversation</a><h2>Frise des auteurs</h2><p class="doux">Classés par date de naissance (ou d\'activité). Touchez un nom pour ouvrir sa fiche.</p><ol class="frise">'+h+'</ol></div>';
  window.scrollTo(0,0);
}
vue.addEventListener("click",function(ev){
  var d=ev.target.closest("[data-dem]");if(d){var e=FICHE[d.dataset.dem];if(e)poser(d.dataset.q||e.t,{t:"fiche",id:e.id,aussi:[]});return}
  var c=ev.target.closest("[data-comp]");if(c){var p=c.dataset.comp.split("-");poser(c.textContent.trim(),{t:"comp",a:p[0],b:p[1]});return}
  var x=ev.target.closest("[data-ex]");if(x){poser(x.dataset.ex);return}
  var k=ev.target.closest("[data-dem-ia]");if(k){copier(DEMANDES[k.dataset.demIa])}
  if(ev.target.id==="effacer-conv"){S.conv=[];sauver();vEncyclo()}
});
vue.addEventListener("submit",function(ev){if(ev.target.id==="form-q"){ev.preventDefault();poser(document.getElementById("question").value)}});
