const attributeGroups = [
  {
    id: "technical", title: "Technique", icon: "T",
    attrs: [
      ["corners","Corners"],["crossing","Centres"],["dribbling","Dribbles"],["finishing","Finition"],
      ["firstTouch","Contrôle de balle"],["freeKicks","Coups francs"],["heading","Jeu de tête"],
      ["longShots","Tirs de loin"],["longThrows","Longs jets"],["marking","Marquage"],
      ["passing","Passes"],["penaltyTaking","Penalty"],["tackling","Tacles"],["technique","Technique"],
      
    ]
  },
  {
    id: "mental", title: "Mental", icon: "M",
    attrs: [
      ["aggression","Agressivité"],["anticipation","Anticipation"],["bravery","Courage"],
      ["composure","Sang-froid"],["concentration","Concentration"],["decisions","Décisions"],
      ["determination","Détermination"],["flair","Inspiration"],["leadership","Leadership"],
      ["offTheBall","Appels de balle"],["positioning","Placement"],["teamwork","Collectif"],
      ["vision","Vision du jeu"],["workRate","Volume de jeu"]
    ]
  },
  {
    id: "physical", title: "Physique", icon: "P",
    attrs: [
      ["acceleration","Accélération"],["agility","Agilité"],["balance","Équilibre"],
      ["jumpingReach","Détente verticale"],["naturalFitness","Condition naturelle"],
      ["pace","Vitesse"],["stamina","Endurance"],["strength","Force"]
    ]
  },
  {
    id: "goalkeeper", title: "Gardien", icon: "G",
    attrs: [
      ["aerialReach","Détente aérienne"],["commandArea","Contrôle de la surface"],
      ["communication","Communication"],["eccentricity","Excentricité"],
      ["handling","Prises de balle"],["kicking","Dégagements"],["oneOnOnes","Un contre un"],
      ["reflexes","Réflexes"],["rushingOut","Sorties aériennes"],["throwing","Relances à la main"],
      ["tendencyToPunch","Tendance à boxer"]
    ]
  }
];

// Pondérations indicatives uniquement : elles ne reproduisent pas la formule interne de FM26.
const positionWeights = {
  gk: { technical: 0.05, mental: 0.22, physical: 0.13, goalkeeper: 0.60,
    attrs: { reflexes: 1.5, handling: 1.4, oneOnOnes: 1.4, aerialReach: 1.1, commandArea: 1.1, positioning: 1.2, anticipation: 1.1, agility: 1.1 } },
  dc: { technical: 0.22, mental: 0.35, physical: 0.43,
    attrs: { marking: 1.5, tackling: 1.5, heading: 1.35, positioning: 1.45, anticipation: 1.25, strength: 1.3, jumpingReach: 1.25, pace: 1.1, bravery: 1.1, concentration: 1.2 } },
  dl: { technical: 0.30, mental: 0.28, physical: 0.42,
    attrs: { tackling: 1.3, marking: 1.2, crossing: 1.35, dribbling: 1.2, pace: 1.4, acceleration: 1.35, stamina: 1.3, workRate: 1.2, positioning: 1.1 } },
  mdf: { technical: 0.28, mental: 0.42, physical: 0.30,
    attrs: { tackling: 1.4, marking: 1.25, passing: 1.2, positioning: 1.4, decisions: 1.3, teamwork: 1.2, anticipation: 1.25, stamina: 1.15 } },
  mc: { technical: 0.34, mental: 0.40, physical: 0.26,
    attrs: { passing: 1.35, firstTouch: 1.2, technique: 1.15, vision: 1.35, decisions: 1.4, teamwork: 1.2, workRate: 1.1, stamina: 1.1 } },
  mo: { technical: 0.42, mental: 0.38, physical: 0.20,
    attrs: { technique: 1.3, dribbling: 1.3, firstTouch: 1.2, passing: 1.2, vision: 1.3, flair: 1.3, decisions: 1.15, offTheBall: 1.15 } },
  ailier: { technical: 0.38, mental: 0.25, physical: 0.37,
    attrs: { dribbling: 1.4, crossing: 1.25, technique: 1.15, acceleration: 1.4, pace: 1.45, agility: 1.2, offTheBall: 1.2, flair: 1.15 } },
  attaquant: { technical: 0.36, mental: 0.34, physical: 0.30,
    attrs: { finishing: 1.5, offTheBall: 1.4, composure: 1.2, firstTouch: 1.2, heading: 1.15, acceleration: 1.1, pace: 1.1, anticipation: 1.2, technique: 1.1 } }
};

const container = document.getElementById("attributes");
const allAttrs = attributeGroups.flatMap(group => group.attrs.map(([id, label]) => ({id, label, group: group.id})));

function renderAttributes() {
  container.innerHTML = attributeGroups.map(group => `
    <section class="attribute-group" data-group="${group.id}">
      <h3 class="group-title"><span class="group-icon">${group.icon}</span>${group.title}</h3>
      <div class="attribute-list">
        ${group.attrs.map(([id, label]) => `
          <label class="attribute-row" for="attr-${id}">
            <div>
              <div class="attribute-label"><span>${label}</span><small>1–20</small></div>
              <div class="attribute-track"><span id="bar-${id}"></span></div>
            </div>
            <input class="attribute-input" id="attr-${id}" data-attr="${id}" type="number" min="1" max="20" step="1" inputmode="numeric" placeholder="—" aria-label="${label}, note de 1 à 20">
          </label>`).join("")}
      </div>
    </section>`).join("");
}
renderAttributes();

function getValues() {
  const values = {};
  document.querySelectorAll("[data-attr]").forEach(input => {
    const raw = input.value.trim();
    const n = raw === "" ? null : Number(raw);
    const valid = n !== null && Number.isInteger(n) && n >= 1 && n <= 20;
    input.classList.toggle("invalid", raw !== "" && !valid);
    const bar = document.getElementById(`bar-${input.dataset.attr}`);
    bar.style.width = valid ? `${n * 5}%` : "0%";
    bar.style.background = valid ? (n >= 15 ? "#8fecc9" : n >= 10 ? "#719e92" : "#657789") : "#719e92";
    values[input.dataset.attr] = valid ? n : null;
  });
  return values;
}

function calcEstimate(values) {
  const position = document.getElementById("position").value;
  const config = positionWeights[position];
  const groupWeights = {...config};
  let weightedSum = 0, totalWeight = 0, count = 0, rawSum = 0;
  const activeGroups = position === "gk" ? ["technical", "mental", "physical", "goalkeeper"] : ["technical", "mental", "physical"];
  const totalGroupWeight = activeGroups.reduce((sum, g) => sum + (config[g] || 0), 0);

  for (const attr of allAttrs) {
    const value = values[attr.id];
    if (value === null) continue;
    if (position === "gk" && attr.group !== "goalkeeper" && attr.group !== "mental" && attr.group !== "physical" && attr.group !== "technical") continue;
    if (position !== "gk" && attr.group === "goalkeeper") continue;
    let weight = config[attr.group] || 0;
    const groupCount = allAttrs.filter(a => a.group === attr.group && !(position !== "gk" && a.group === "goalkeeper")).length;
    if (!groupCount || !weight) continue;
    weight = weight / groupCount;
    weight *= (config.attrs && config.attrs[attr.id]) || 1;
    weightedSum += value * weight;
    totalWeight += weight;
    rawSum += value;
    count++;
  }

  if (count === 0 || totalWeight === 0) return {ca: null, avg: null, count};
  const average = weightedSum / totalWeight;
  // Mapping linéaire indicative uniquement, pas la formule de Football Manager.
  const ca = Math.round(Math.max(1, Math.min(200, average * 10)));
  return {ca, avg: rawSum / count, count};
}

function update() {
  const values = getValues();
  const result = calcEstimate(values);
  document.getElementById("caValue").textContent = result.ca === null ? "—" : result.ca;
  document.getElementById("averageValue").textContent = result.avg === null ? "— / 20" : `${result.avg.toFixed(1).replace(".", ",")} / 20`;
  document.getElementById("filledCount").textContent = `${result.count} / ${allAttrs.length}`;
  document.getElementById("meterFill").style.width = result.ca === null ? "0%" : `${result.ca / 2}%`;

  const name = document.getElementById("playerName").value.trim();
  const caption = document.getElementById("resultCaption");
  if (result.ca === null) caption.textContent = "Renseigne les attributs pour lancer l'estimation.";
  else caption.textContent = `${name ? name + " · " : ""}Estimation indicative pour le poste sélectionné. Ce résultat n'est pas la CA officielle du jeu.`;

  document.querySelectorAll(".attribute-group").forEach(group => {
    group.hidden = document.getElementById("position").value === "gk" ? false : group.dataset.group === "goalkeeper";
  });
}
document.addEventListener("input", event => {
  if (event.target.matches("[data-attr], #playerName, #playerAge")) update();
});
document.getElementById("position").addEventListener("change", update);
document.getElementById("fillTen").addEventListener("click", () => {
  document.querySelectorAll("[data-attr]").forEach(input => {
    if (!input.closest(".attribute-group").hidden) input.value = 10;
  });
  update();
});
document.getElementById("reset").addEventListener("click", () => {
  document.querySelectorAll("[data-attr], #playerName, #playerAge").forEach(input => input.value = "");
  document.getElementById("position").value = "mc";
  update();
});
update();
