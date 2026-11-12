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
    {
        id:"vela-led-natal",
        nome:"Vela LED - Natal",
        custo:1.39,
        ativo:true
    }
];

function ler(chave,padrao) {
    try {
        const valor = JSON.parse(localStorage.getItem(chave));
        return Array.isArray(valor) ? valor : padrao;
    } catch {
        return padrao;
    }
}

let fil = ler(FKEY,padraoF);
let adi = ler(AKEY,padraoA);
let editF = -1;
let editA = null;
let exclusaoPendente = null;

const moeda = valor => Number(valor).toLocaleString("pt-BR",{
    style:"currency",
    currency:"BRL"
});

function mensagem(texto,tipo="sucesso") {
    const el = $("statusCadastro");
    if (!el) return;
    el.textContent = texto;
    el.style.padding = "14px 18px";
    el.style.margin = "16px 0";
    el.style.borderRadius = "9px";
    el.style.fontWeight = "600";
    el.style.background = tipo==="erro" ? "#fff0f0" : "#e8f7f3";
    el.style.color = tipo==="erro" ? "#a32020" : "#006b58";
    el.style.border = tipo==="erro"
        ? "1px solid #efb5b5"
        : "1px solid #a6dccc";
}

function salvar(texto="Cadastros atualizados com sucesso.") {
    try {
        localStorage.setItem(FKEY,JSON.stringify(fil));
        localStorage.setItem(AKEY,JSON.stringify(adi));
        render();
        mensagem(texto);
    } catch(e) {
        mensagem("Nao foi possivel salvar: "+e.message,"erro");
    }
}

function td(tr,conteudo) {
    const celula=document.createElement("td");
    if(conteudo instanceof Node) celula.appendChild(conteudo);
    else celula.textContent=String(conteudo);
    tr.appendChild(celula);
    return celula;
}

function botao(texto,acao,classe="") {
    const b=document.createElement("button");
    b.type="button";
    b.textContent=texto;
    if(classe) b.className=classe;
    b.addEventListener("click",function(evento) {
        evento.preventDefault();
        evento.stopPropagation();
        acao();
    });
    return b;
}

function confirmarExclusao(tipo, identificador, nome, tr) {
    if (exclusaoPendente) {
        exclusaoPendente.remove();
        exclusaoPendente = null;
    }

    const linha = document.createElement("tr");
    linha.className = "duo-confirmacao-inline";

    const celula = document.createElement("td");
    celula.colSpan = 4;
    celula.style.cssText =
        "padding:18px;background:#fff5ed;border:1px solid #efcfb3;";

    const titulo = document.createElement("strong");
    titulo.textContent = "Confirmar exclusão: " + nome;

    const acoes = document.createElement("div");
    acoes.style.cssText =
        "display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;";

    const confirmar = document.createElement("button");
    confirmar.type = "button";
    confirmar.textContent = "Sim, excluir";
    confirmar.style.cssText =
        "background:#b42318;color:white;padding:10px 16px;";

    const cancelar = document.createElement("button");
    cancelar.type = "button";
    cancelar.textContent = "Cancelar";

    confirmar.addEventListener("click", function(evento) {
        evento.preventDefault();
        evento.stopPropagation();

        if (tipo === "filamento") {
            const indice = fil.findIndex(f => f.nome === identificador);

            if (indice < 0) {
                mensagem("Filamento nao encontrado.","erro");
                return;
            }

            fil.splice(indice,1);
            editF = -1;
            $("formFil").reset();
        } else {
            const indice = adi.findIndex(a => a.id === identificador);

            if (indice < 0) {
                mensagem("Adicional nao encontrado.","erro");
                return;
            }

            adi.splice(indice,1);
            editA = null;
            $("formAdi").reset();
        }

        exclusaoPendente = null;
        salvar("Item excluido com sucesso: " + nome);
    });

    cancelar.addEventListener("click", function(evento) {
        evento.preventDefault();
        evento.stopPropagation();
        linha.remove();
        exclusaoPendente = null;
        mensagem("Exclusao cancelada.");
    });

    acoes.append(confirmar,cancelar);
    celula.append(titulo,acoes);
    linha.appendChild(celula);

    tr.insertAdjacentElement("afterend",linha);
    exclusaoPendente = linha;

    linha.scrollIntoView({
        behavior:"smooth",
        block:"nearest"
    });
}
function render() {
    const tabelaF=$("tabelaFil");
    const tabelaA=$("tabelaAdi");

    tabelaF.replaceChildren();
    tabelaA.replaceChildren();
    exclusaoPendente=null;

    fil.forEach((f,i)=>{
        const tr=document.createElement("tr");
        td(tr,f.nome);
        td(tr,moeda(f.custo));

        const cor=document.createElement("input");
        cor.type="color";
        cor.value=/^#[0-9a-f]{6}$/i.test(f.cor)
            ? f.cor : "#888888";
        cor.disabled=true;
        td(tr,cor);

        const acoes=document.createElement("div");
        acoes.style.display="flex";
        acoes.style.gap="6px";

        acoes.append(
            botao("Editar",()=>{
                editF=i;
                $("filNome").value=f.nome;
                $("filCusto").value=f.custo;
                $("filCor").value=cor.value;
                $("filNome").focus();
                $("formFil").scrollIntoView({
                    behavior:"smooth",
                    block:"center"
                });
                mensagem("Editando filamento: "+f.nome);
            }),
            botao("Excluir",()=>{
                confirmarExclusao("filamento",f.nome,f.nome,tr);
            })
        );

        td(tr,acoes);
        tabelaF.appendChild(tr);
    });

    adi.forEach(a=>{
        const tr=document.createElement("tr");
        td(tr,a.nome);
        td(tr,moeda(a.custo));
        td(tr,a.ativo?"Ativo":"Inativo");

        const acoes=document.createElement("div");
        acoes.style.display="flex";
        acoes.style.gap="6px";
        acoes.style.flexWrap="wrap";

        acoes.append(
            botao("Editar",()=>{
                editA=a.id;
                $("adiNome").value=a.nome;
                $("adiCusto").value=a.custo;
                $("adiAtivo").value=String(a.ativo);
                $("adiNome").focus();
                $("formAdi").scrollIntoView({
                    behavior:"smooth",
                    block:"center"
                });
                mensagem("Editando adicional: "+a.nome);
            }),
            botao(a.ativo?"Desativar":"Ativar",()=>{
                a.ativo=!a.ativo;
                salvar("Disponibilidade atualizada: "+a.nome);
            }),
            botao("Excluir",()=>{
                confirmarExclusao("adicional",a.id,a.nome,tr);
            })
        );

        td(tr,acoes);
        tabelaA.appendChild(tr);
    });
}

$("formFil").addEventListener("submit",e=>{
    e.preventDefault();

    const nome=$("filNome").value.trim();
    const custo=Number($("filCusto").value);

    if(!nome||!Number.isFinite(custo)||custo<0) {
        mensagem("Preencha os dados do filamento corretamente.","erro");
        return;
    }

    const item={
        nome,
        custo,
        cor:$("filCor").value
    };

    if(editF>=0) fil[editF]=item;
    else fil.push(item);

    editF=-1;
    e.target.reset();
    salvar("Filamento salvo: "+nome);
});

$("formAdi").addEventListener("submit",e=>{
    e.preventDefault();

    const nome=$("adiNome").value.trim();
    const custo=Number($("adiCusto").value);

    if(!nome||!Number.isFinite(custo)||custo<0) {
        mensagem("Preencha os dados do adicional corretamente.","erro");
        return;
    }

    const id=editA||(
        "adicional-"+Date.now().toString(36)+
        "-"+Math.random().toString(36).slice(2,8)
    );

    const item={
        id,
        nome,
        custo,
        ativo:$("adiAtivo").value==="true"
    };

    if(editA) {
        const indice=adi.findIndex(a=>a.id===editA);
        if(indice>=0) adi[indice]=item;
    } else {
        adi.push(item);
    }

    editA=null;
    e.target.reset();
    salvar("Adicional salvo: "+nome);
});

$("cancelarFil").addEventListener("click",()=>{
    editF=-1;
    $("formFil").reset();
    mensagem("Edicao de filamento cancelada.");
});

$("cancelarAdi").addEventListener("click",()=>{
    editA=null;
    $("formAdi").reset();
    mensagem("Edicao de adicional cancelada.");
});

render();