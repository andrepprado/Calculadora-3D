"use strict";

const FKEY = "duolab_filamentos_v2";
const AKEY = "duolab_adicionais_v2";
const $ = id => document.getElementById(id);

const padraoF = [
["VOOLT - PLA BEGE CAUCASIANO VELVET HIGH SPEED PREMIUM",92.32,"#D6BC9B"],
["VOOLT - PLA BRANCO VELVET HIGH SPEED PREMIUM",92.32,"#F8F8F6"],
["VOOLT - PLA PRETO VELVET HIGH SPEED PREMIUM",92.32,"#181818"],
["VOOLT - PLA VERMELHO VELVET HIGH SPEED PREMIUM",92.32,"#C62828"],
["BAMBU LAB - PLA AMARELO",128.90,"#FFD400"],
["BAMBU LAB - PLA AZUL",128.90,"#0057B8"],
["BAMBU LAB - PLA VERDE",128.90,"#00A651"],
["SUNLU - PETG AZUL BRILHANTE",75.20,"#005EB8"],
["SUNLU - PLA MARMORE BRANCO",120.99,"#ECEAE4"],
["ELEGOO - PLA SILK ROXO E PRETO",113.90,"#5B2A86"],
["ELEGOO - PLA MATTE LARANJA",103.80,"#E67E22"],
["ELEGOO - PLA SILK ROXO E AZUL",113.90,"#5D3FD3"],
["MASTERPRINT - PETG MARROM",83.90,"#6B4423"],
["MASTERPRINT - PETG BEGE",83.90,"#D9C2A0"],
["MASTERPRINT - PETG PRETO",99.99,"#171717"],
["VOOLT - PLA ROSA PÚRPURA HIGH SPEED",97.14,"#A62D78"],
["VOOLT - PLA OUTLET (COR VARIÁVEL)",74.78,"#888888"],
["VOOLT - PLA VERDE V-SILK HIGH SPEED",96.18,"#278F5B"],
["VOOLT - PLA DOURADO V-SILK HIGH SPEED",96.18,"#C8A44B"]
].map(([nome,custo,cor]) => ({nome,custo,cor}));

const padraoA = [
{id:"vela-led-natal",nome:"Vela LED - Natal",custo:1.39,ativo:true}
];

function ler(chave,padrao) {
    try {
        const v=JSON.parse(localStorage.getItem(chave));
        return Array.isArray(v)?v:padrao;
    } catch { return padrao; }
}

let fil=ler(FKEY,padraoF);
let adi=ler(AKEY,padraoA);
let editF=-1;
let editA=null;

const moeda=n=>Number(n).toLocaleString("pt-BR",{
    style:"currency",currency:"BRL"
});

function salvar() {
    localStorage.setItem(FKEY,JSON.stringify(fil));
    localStorage.setItem(AKEY,JSON.stringify(adi));
    $("statusCadastro").textContent="Cadastros salvos com sucesso.";
    render();
}

function td(tr,valor) {
    const c=document.createElement("td");
    if(valor instanceof Node)c.appendChild(valor);
    else c.textContent=String(valor);
    tr.appendChild(c);
}

function btn(texto,acao) {
    const b=document.createElement("button");
    b.type="button";
    b.textContent=texto;
    b.addEventListener("click",acao);
    return b;
}

function render() {
    $("tabelaFil").replaceChildren();
    $("tabelaAdi").replaceChildren();

    fil.forEach((f,i)=>{
        const tr=document.createElement("tr");
        td(tr,f.nome);
        td(tr,moeda(f.custo));
        const cor=document.createElement("input");
        cor.type="color";
        cor.value=/^#[0-9a-f]{6}$/i.test(f.cor)?f.cor:"#888888";
        cor.disabled=true;
        td(tr,cor);

        const acoes=document.createElement("div");
        acoes.append(
            btn("Editar",()=>{
                editF=i;
                $("filNome").value=f.nome;
                $("filCusto").value=f.custo;
                $("filCor").value=cor.value;
                $("filNome").focus();
            }),
            btn("Excluir",()=>{
                if(!confirm("Excluir filamento?"))return;
                fil.splice(i,1);
                editF=-1;
                $("formFil").reset();
                salvar();
            })
        );
        td(tr,acoes);
        $("tabelaFil").appendChild(tr);
    });

    adi.forEach(a=>{
        const tr=document.createElement("tr");
        td(tr,a.nome);
        td(tr,moeda(a.custo));
        td(tr,a.ativo?"Ativo":"Inativo");

        const acoes=document.createElement("div");
        acoes.append(
            btn("Editar",()=>{
                editA=a.id;
                $("adiNome").value=a.nome;
                $("adiCusto").value=a.custo;
                $("adiAtivo").value=String(a.ativo);
                $("adiNome").focus();
            }),
            btn(a.ativo?"Desativar":"Ativar",()=>{
                a.ativo=!a.ativo;
                salvar();
            }),
            btn("Excluir",()=>{
                if(!confirm("Excluir adicional?"))return;
                adi=adi.filter(x=>x.id!==a.id);
                editA=null;
                $("formAdi").reset();
                salvar();
            })
        );
        td(tr,acoes);
        $("tabelaAdi").appendChild(tr);
    });
}

$("formFil").addEventListener("submit",e=>{
    e.preventDefault();
    const nome=$("filNome").value.trim();
    const custo=Number($("filCusto").value);
    if(!nome||!Number.isFinite(custo)||custo<0)return;

    const item={nome,custo,cor:$("filCor").value};
    if(editF>=0)fil[editF]=item;
    else fil.push(item);

    editF=-1;
    e.target.reset();
    salvar();
});

$("formAdi").addEventListener("submit",e=>{
    e.preventDefault();
    const nome=$("adiNome").value.trim();
    const custo=Number($("adiCusto").value);
    if(!nome||!Number.isFinite(custo)||custo<0)return;

    const id=editA||(
        "adicional-"+Date.now().toString(36)+
        "-"+Math.random().toString(36).slice(2,8)
    );

    const item={
        id,nome,custo,
        ativo:$("adiAtivo").value==="true"
    };

    if(editA) {
        const i=adi.findIndex(x=>x.id===editA);
        if(i>=0)adi[i]=item;
    } else adi.push(item);

    editA=null;
    e.target.reset();
    salvar();
});

$("cancelarFil").addEventListener("click",()=>{
    editF=-1;
    $("formFil").reset();
});

$("cancelarAdi").addEventListener("click",()=>{
    editA=null;
    $("formAdi").reset();
});

render();