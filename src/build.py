#!/usr/bin/env python3
# Assemble l'appli : part de base-index.html (version 9/11) et ajoute l'encyclopédie.
import glob,os,re
D=os.path.dirname(os.path.abspath(__file__))
s=open(os.path.join(D,"base-index.html"),encoding="utf-8").read()
def rep(a,b):
    global s
    assert a in s,"introuvable : "+a[:60]
    s=s.replace(a,b,1)
CSS=open(os.path.join(D,"encyclo.css"),encoding="utf-8").read()
rep("</style>",CSS+"\n</style>")
SOUS="Votre encyclopédie de philosophie et de psychanalyse, et votre guide des IA gratuites"
rep("<p>Votre professeur pour choisir et utiliser les IA gratuites, et votre professeur de philosophie</p>","<p>"+SOUS+"</p>")
rep('<meta name="description" content="Votre professeur pour choisir et utiliser les IA gratuites, et votre professeur de philosophie.">','<meta name="description" content="'+SOUS+'.">')
# Onglets : Encyclopédie d'abord, les IA ensuite
nav=re.search(r'<nav class="onglets"[^>]*>\n(.*?)</nav>',s,re.S)
liens=dict((re.search(r'data-v="(\w+)"',l).group(1),l) for l in nav.group(1).strip().split("\n"))
liens["accueil"]='  <a href="#accueil" data-v="accueil"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5A2.5 2.5 0 0 1 6.5 19H20"/></svg>Encyclopédie</a>'
ordre=["accueil","reflechir","parcours","orienter","guide","progression"]
s=s[:nav.start(1)]+"\n".join(liens[k].rstrip() for k in ordre)+"\n"+s[nav.end(1):]
# Données et moteur, juste avant le routeur
code="".join(open(f,encoding="utf-8").read()+"\n" for f in sorted(glob.glob(os.path.join(D,"enc-*.js"))))
code+=open(os.path.join(D,"encyclo-ui.js"),encoding="utf-8").read()
rep("function route(){",code+"\nfunction route(){")
rep('  if(m){onglet="parcours";vLecon(+m[1]-1)}','''  var mf=/^fiche-([a-z_]+)$/.exec(h),mc=/^comparer-([a-z_]+)-([a-z_]+)$/.exec(h);
  if(mf){onglet="accueil";vFiche(mf[1])}
  else if(mc){onglet="accueil";vComparer(mc[1],mc[2])}
  else if(h==="index"){onglet="accueil";vIndex()}
  else if(h==="frise"){onglet="accueil";vFrise()}
  else if(m){onglet="parcours";vLecon(+m[1]-1)}''')
rep('else{onglet="accueil";vAccueil()}','else{onglet="accueil";vEncyclo()}')
rep("<p><strong>Alfred vous apprend à utiliser les IA, il ne répond pas à votre place.</strong> Il n'est ni médecin, ni psychologue,",
    "<p><strong>Alfred est une encyclopédie et un professeur : il vous aide à penser par vous-même.</strong> Ses fiches de psychanalyse servent à comprendre, pas à poser un diagnostic. Il n'est ni médecin, ni psychologue,")
m=open(os.path.join(D,"..","manifest.webmanifest"),encoding="utf-8").read()
m=re.sub(r'"description": "[^"]*"','"description": "'+SOUS+'."',m)
open(os.path.join(D,"..","manifest.webmanifest"),"w",encoding="utf-8").write(m)
open(os.path.join(D,"..","index.html"),"w",encoding="utf-8").write(s)
print("index.html :",len(s.encode())//1024,"Ko")
