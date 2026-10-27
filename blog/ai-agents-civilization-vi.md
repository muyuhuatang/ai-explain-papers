---
title: "Playing Civilization VI with AI agents: learning, adopting and creating strategy"
description: "A primer on how AI agents can play a strategy game like Civilization VI: how they learn strategies, put them to use and invent new ones, what happened when frontier models played full games, and what still stands in the way."
date: 2026-10-27
tags: [AI agents, games, strategy, LLMs, reinforcement learning]
---

Games have long been where AI shows what it can do. Computers beat the world chess champion in 1997 and one of the world’s best Go players in 2016. They reached grandmaster level in StarCraft II, beat the world champions at a restricted version of Dota 2 and played the negotiation game Diplomacy at a human level (Figure 1). Civilization VI is a harder test than most. A single game lasts hundreds of turns, every turn offers a huge number of possible moves, and winning means balancing economy, science, culture, religion, war and diplomacy at the same time. That makes it a good lens on what today’s AI agents can and cannot do.

This post covers the foundations: what makes Civilization hard, the main ways to build an agent that plays it, and what happened when the frontier models of early 2026 played full games. It then looks at how an agent could learn strategies, adopt them in a game and create new ones, and ends with the open challenges, the pathways that look most promising and open-source code to start from.

<figure class="figure" id="fig-milestones">
<ol class="timeline">
<li><span class="timeline-year">1997</span><span class="timeline-text"><strong>Chess.</strong> IBM’s Deep Blue beats world champion Garry Kasparov in a six-game match.<span class="timeline-how">Search with a hand-crafted evaluation</span></span></li>
<li class="is-civ"><span class="timeline-year">2011</span><span class="timeline-text"><strong>Civilization II.</strong> Playing Freeciv, an open-source version of the game, an agent that reads the official manual wins 79% of full games against the built-in AI, against 62% for the same kind of agent without it.<span class="timeline-how">Monte-Carlo search guided by text</span></span></li>
<li><span class="timeline-year">2016</span><span class="timeline-text"><strong>Go.</strong> AlphaGo beats Lee Sedol, one of the world’s strongest players, 4–1.<span class="timeline-how">Learning from human games and from self-play, with tree search</span></span></li>
<li><span class="timeline-year">2019</span><span class="timeline-text"><strong>Dota 2.</strong> OpenAI Five beats OG, the reigning world champions, in a version of the game limited to 17 heroes.<span class="timeline-how">Self-play reinforcement learning</span></span></li>
<li><span class="timeline-year">2019</span><span class="timeline-text"><strong>StarCraft II.</strong> AlphaStar reaches Grandmaster level, above 99.8% of ranked human players.<span class="timeline-how">Imitation of human games, then a league of self-play</span></span></li>
<li><span class="timeline-year">2022</span><span class="timeline-text"><strong>Diplomacy.</strong> CICERO plays at a human level in a game that turns on negotiating in natural language.<span class="timeline-how">Language model plus strategic planning</span></span></li>
<li><span class="timeline-year">2023</span><span class="timeline-text"><strong>Minecraft.</strong> Voyager explores on its own and stores the skills it learns as reusable code.<span class="timeline-how">Language-model agent (GPT-4)</span></span></li>
<li class="is-civ"><span class="timeline-year">2024</span><span class="timeline-text"><strong>Freeciv.</strong> CivRealm opens a Civilization-like research environment; both reinforcement-learning and language agents struggle to make substantial progress in the full game.<span class="timeline-how">Environment for learning and reasoning agents</span></span></li>
<li class="is-civ"><span class="timeline-year">2025</span><span class="timeline-text"><strong>Civilization V.</strong> Vox Deorum lets a language model set the strategy that Vox Populi’s AI then carries out, in 1,408 complete games.<span class="timeline-how">Language model plus algorithmic AI</span></span></li>
<li class="is-civ"><span class="timeline-year">2026</span><span class="timeline-text"><strong>Civilization VI.</strong> CivBench: frontier models of early 2026 play full games of the real game through 76 tools, and win 3 of 23.<span class="timeline-how">Language-model agents with tools</span></span></li>
</ol>
<figcaption><strong>Figure 1.</strong> Milestones in game-playing AI. Filled dots mark games in the Civilization family. Sources: the papers listed under Further reading, and DeepMind’s account of the AlphaGo match.</figcaption>
</figure>

## Why Civilization VI is hard for AI

Civilization VI belongs to the 4X genre: explore, expand, exploit, exterminate. Several of its properties make it hard for an agent:

- **Very long games.** A game runs for hundreds of turns. In the CivBench study described below, games at the faster “quick” speed, which ends at turn 330, lasted about 300 turns (the median was exactly 300). A choice made in the first 20 turns, such as where to found a city, can still shape the game 200 turns later. Connecting late results to early decisions is what reinforcement learning calls the credit assignment problem.
- **Enormous action spaces.** Each turn, a player moves many units, chooses what every city builds, picks technologies, civics and policies, and places districts on a hex map. A chess position offers about 35 legal moves and a Go position about 250. In a 2011 study of the much older Civilization II, a single turn already offered about 10<sup>21</sup> combinations (Figure 2).
- **Hidden information.** Fog of war hides most of the map and the other players’ plans.
- **Many players and many ways to win.** With the Gathering Storm expansion, which CivBench uses, the game has six victory conditions: science, culture, domination, religion, diplomacy and score. (The base game has no diplomatic victory.) The other civilizations react to what you do, and diplomacy adds negotiation, trust and betrayal.
- **No official interface.** Civilization VI is a commercial game with no official interface for AI agents. Research has mostly used open-source relatives instead: Freeciv since at least 2011 and, more recently, Unciv. Only recently have agents been connected to the real game, through the debugging connection that Firaxis provides for modders.

<figure class="figure" id="fig-breadth">
<div class="chart">
<div class="chart-row has-grid"><span class="chart-label">Chess<small>one move</small></span><span class="chart-plot"><span class="dot" style="--x:6.43%"></span><span class="dot-value" style="--x:6.43%">about 35</span></span></div>
<div class="chart-row has-grid"><span class="chart-label">Go<small>one move</small></span><span class="chart-plot"><span class="dot" style="--x:9.99%"></span><span class="dot-value" style="--x:9.99%">about 250</span></span></div>
<div class="chart-row has-grid"><span class="chart-label">Civilization II<small>one turn, 2011 study</small></span><span class="chart-plot"><span class="dot" style="--x:87.50%"></span><span class="dot-value is-left" style="--x:87.50%">about 10<sup>21</sup></span></span></div>
<div class="chart-row chart-axis"><span class="chart-label"></span><span class="chart-plot"><span style="--x:0.00%">1</span><span style="--x:25.00%">10<sup>6</sup></span><span style="--x:50.00%">10<sup>12</sup></span><span style="--x:75.00%">10<sup>18</sup></span><span style="--x:100.00%">10<sup>24</sup></span></span></div>
</div>
<figcaption><strong>Figure 2.</strong> How many moves one turn offers. A chess position has about 35 legal moves and a Go position about 250. In a 2011 study of Civilization II, a player controlled about 18 units with 15 possible actions each: about 10<sup>21</sup> combinations in a single turn. Each gridline on this logarithmic scale is a million times the one before. Sources: Silver et al. (2016); Branavan, Silver and Barzilay (2011).</figcaption>
</figure>

The built-in AI shows how hard the game is. Its higher difficulty levels do not make it play better. Instead, they [give it head starts and bonuses](https://www.thegamer.com/civilization-6-difficulty-levels-explained/), such as extra settlers and builders at the start and more production, gold and combat strength.

## Three ways to build a game-playing agent

**Rules and search.** The classic approach encodes expert rules (“build a Campus next to mountains”), often combined with search that looks a few moves ahead. Most built-in game AIs work this way, and Deep Blue beat Kasparov with fast search and a hand-crafted evaluation of positions. Rules are predictable and cheap to run, but they cannot discover anything their authors did not foresee.

**Reinforcement learning.** The agent plays huge numbers of games, often against copies of itself, and gradually learns which actions lead to wins. Self-play reinforcement learning, sometimes combined with search or with learning from human games, produced AlphaGo, AlphaStar for StarCraft II and OpenAI Five for Dota 2. It needs a fast simulator and a lot of compute (OpenAI Five trained for ten months), and the strategies it learns live inside a neural network that is hard to read.

**Language-model agents.** A large language model reads a text description of the game state, reasons about it and chooses actions through a programming interface. Agent frameworks add memory, planning and reflection. ReAct interleaves reasoning steps with actions. Reflexion has the agent write down lessons from its failures. Voyager, a Minecraft agent, stores the skills it learns as reusable code. Language-model agents bring broad prior knowledge, very likely including much of what players have written about Civilization over the years, and they can explain their choices. They are also slow and expensive per decision, and they make mistakes that a rule-based system never would.

<div class="table-wide">

| | Rules and search | Reinforcement learning | Language-model agents |
| --- | --- | --- | --- |
| Learns from | Rules written by experts | Many games, often against itself | Text from training, plus what it reads and reflects on during play |
| Strong at | Speed and predictability | Precise play in a fixed game | Broad knowledge, explaining itself, taking instructions in plain language |
| Weak at | Anything its authors did not foresee | Needs a fast simulator and huge compute; hard to interpret | Cost and speed per decision; spatial and numerical slips |
| Examples | Built-in game AIs, Deep Blue | AlphaGo, AlphaStar, OpenAI Five | ReAct, Reflexion, Voyager, the CivBench agents |

</div>

The idea that language helps is older than today’s chatbots. In 2011, Branavan, Silver and Barzilay built an agent that played Freeciv, an open-source version of Civilization II, and read the official Civilization II manual to guide its search. It won 79% of full games against the game’s built-in AI, against 62% for the same kind of agent without the manual. More recently, CivRealm turned Freeciv into a research environment with interfaces for both reinforcement learning and language-model agents. In its first results, both kinds of agent struggled to make substantial progress in the full game.

Several recent agents combine the approaches. Vox Deorum, built on the Vox Populi mod for Civilization V, lets a language model make the high-level choices: which victory to pursue, economic and military priorities, the next technology and policy, and how friendly or hostile to be. Unit moves, combat and city production are left to Vox Populi’s algorithmic AI. In 2,327 complete games on tiny four-player maps, 1,408 of them with a language model in charge, two openly released models in this role, GPT-OSS-120B and GLM-4.6, won about as often as Vox Populi’s own AI, a statistical tie, while playing in styles that differed from it and from each other.

## What happened when frontier models played Civilization VI

In 2026, researchers from the University of Oxford, Google DeepMind, the UK AI Security Institute and other institutions released CivBench, a benchmark that connects language-model agents to the real Civilization VI. Its open-source server, civ6-mcp, talks to the game over FireTuner, the debugging connection that Firaxis provides for modders. FireTuner has to be switched on in the game’s settings (on macOS and Linux, by editing its options file), and on Windows it also needs the Civilization VI SDK. The server gives the agent 76 tools through the Model Context Protocol, so the agent reads the game state and gives orders the way it would call any other tool. A typical turn takes 5 to 15 tool calls, and a full game takes thousands.

The team ran 23 full games against the game’s built-in AI with four model families: Claude Opus 4.6, GPT-5.4 and Gemini 3.1 Pro, with six to eight games each, and Kimi K2.5 in one exploratory game. The authors call the results a pilot rather than a ranking of models, but three patterns stand out:

- **Wins were rare.** The agents won 3 of the 23 games, all of them science victories in the easier of the two scenarios reported; the other allowed only a military victory.
- **The agents did not look where it mattered.** Their playbook advised checking every 20 turns whether a rival was close to winning. They checked only about once every 30 to 75 turns (Figure 3), and in 7 of the 20 games they lost, they had not checked in the 20 turns before the game ended.
- **They did not follow their own plans.** Each agent kept a diary of near-term plans, such as “Found second city” and “Build campuses in new cities”. For the three models that made enough of these commitments to analyse, only 48% to 66% were carried out within ten turns, counting a partly carried-out one as half.

<figure class="figure" id="fig-monitoring">
<div class="chart">
<div class="chart-row tick-line"><span class="chart-label">Advised<small>every 20 turns</small></span><span class="chart-plot"><span class="tick is-quiet" style="--x:6.67%" title="Turn 20"></span><span class="tick is-quiet" style="--x:13.33%" title="Turn 40"></span><span class="tick is-quiet" style="--x:20.00%" title="Turn 60"></span><span class="tick is-quiet" style="--x:26.67%" title="Turn 80"></span><span class="tick is-quiet" style="--x:33.33%" title="Turn 100"></span><span class="tick is-quiet" style="--x:40.00%" title="Turn 120"></span><span class="tick is-quiet" style="--x:46.67%" title="Turn 140"></span><span class="tick is-quiet" style="--x:53.33%" title="Turn 160"></span><span class="tick is-quiet" style="--x:60.00%" title="Turn 180"></span><span class="tick is-quiet" style="--x:66.67%" title="Turn 200"></span><span class="tick is-quiet" style="--x:73.33%" title="Turn 220"></span><span class="tick is-quiet" style="--x:80.00%" title="Turn 240"></span><span class="tick is-quiet" style="--x:86.67%" title="Turn 260"></span><span class="tick is-quiet" style="--x:93.33%" title="Turn 280"></span><span class="tick is-quiet" style="--x:100.00%" title="Turn 300"></span></span></div>
<div class="chart-row tick-line"><span class="chart-label">Agents, most often<small>about every 30 turns</small></span><span class="chart-plot"><span class="tick" style="--x:10.00%" title="Turn 30"></span><span class="tick" style="--x:20.00%" title="Turn 60"></span><span class="tick" style="--x:30.00%" title="Turn 90"></span><span class="tick" style="--x:40.00%" title="Turn 120"></span><span class="tick" style="--x:50.00%" title="Turn 150"></span><span class="tick" style="--x:60.00%" title="Turn 180"></span><span class="tick" style="--x:70.00%" title="Turn 210"></span><span class="tick" style="--x:80.00%" title="Turn 240"></span><span class="tick" style="--x:90.00%" title="Turn 270"></span><span class="tick" style="--x:100.00%" title="Turn 300"></span></span></div>
<div class="chart-row tick-line"><span class="chart-label">Agents, least often<small>about every 75 turns</small></span><span class="chart-plot"><span class="tick" style="--x:25.00%" title="Turn 75"></span><span class="tick" style="--x:50.00%" title="Turn 150"></span><span class="tick" style="--x:75.00%" title="Turn 225"></span><span class="tick" style="--x:100.00%" title="Turn 300"></span></span></div>
<div class="chart-row chart-axis"><span class="chart-label"></span><span class="chart-plot"><span style="--x:0.00%">0</span><span style="--x:33.33%">100</span><span style="--x:66.67%">200</span><span style="--x:100.00%">300 turns</span></span></div>
</div>
<figcaption><strong>Figure 3.</strong> How often agents checked whether a rival was close to winning, in CivBench’s full games of Civilization VI. The agents’ playbook advised a check every 20 turns; they checked only about once every 30 to 75 turns. Each tick is one check in a 300-turn game, the median game length, evenly spaced for illustration. In 7 of the 20 games they lost, the agents had not checked in the 20 turns before the game ended. Source: Andrews, Wilkinson et al. (2026).</figcaption>
</figure>

Each game cost between $31 and $229 in API fees and took 2 to 8 hours. At that price and pace, a language-model agent cannot play anything like the vast numbers of games that reinforcement learning learns from.

Confusingly, there is another CivBench, which appeared five months earlier: the Vox Deorum team’s benchmark and leaderboard for Civilization V, described in its own paper at COLM 2026. It is unrelated to the Civilization VI benchmark.

## Learning strategies

An agent can acquire strategy in three ways:

- **From experience.** Through self-play, reinforcement learning discovers what works without being told. AlphaStar trained a whole league of agents, including some whose only job was to exploit the weaknesses of others, so that the main agents became robust.
- **From people.** Human games, replays and guides hold strategies that took players years to refine. An agent can imitate recorded games, as AlphaStar did before self-play, or look up guides and the game’s encyclopedia, the Civilopedia, when it needs them.
- **From its own reflection.** A language-model agent can review a finished game, write down what went wrong (“my capital was undefended when the Mongols attacked”) and read those notes before the next game. This is learning without changing the model’s weights, the idea behind Reflexion.

## Adopting a strategy

Knowing strategies is not the same as using the right one. Adopting a strategy means matching it to the situation: the civilization you play, the map, your neighbours and the stage of the game. A coastal start favours a different plan from a start surrounded by mountains, and a peaceful neighbour invites trade where an aggressive one calls for walls.

It also means acting on the plan, which is harder for language models than it sounds. The BALROG benchmark of game-playing agents describes a “knowing–doing gap”: models make moves whose bad consequences they can describe when asked, such as eating rotten food in NetHack. CivBench’s diaries showed the same gap over a long game.

For an agent, adoption is planning at several levels (Figure 4). A strategic layer picks a victory path and sets goals for the coming era. An operational layer turns those goals into plans, such as which districts to build where and which technologies to research first. A tactical layer moves units and fights battles. Language models are most useful at the top, where knowledge and reasoning matter most and decisions are few, and least reliable at the bottom, where thousands of precise spatial decisions have to be made quickly.

<figure class="figure" id="fig-layers">
<div class="layers">
<div class="layer is-memory"><p class="layer-name">Strategy library</p><div><p>Plans and lessons from past games, guides and reflection.</p><p class="layer-who">Read before planning, updated after each game</p></div></div>
<p class="layer-link"><span>lessons ↓</span><span>↑ new lessons</span></p>
<div class="layer"><p class="layer-name">Strategy</p><div><p>Choose a victory path and set goals for the coming era.</p><p class="layer-who">Language model, every few turns</p></div></div>
<p class="layer-link"><span>goals ↓</span><span>↑ progress</span></p>
<div class="layer"><p class="layer-name">Operations</p><div><p>Decide what each city builds, the order of research and where districts go.</p><p class="layer-who">Language model or planner, every turn</p></div></div>
<p class="layer-link"><span>orders ↓</span><span>↑ reports</span></p>
<div class="layer"><p class="layer-name">Tactics</p><div><p>Move units, fight battles, explore the map.</p><p class="layer-who">Rules, search or a learned policy, many times a turn</p></div></div>
<p class="layer-link"><span>actions ↓</span><span>↑ game state</span></p>
<div class="layer is-game"><p class="layer-name">The game</p><div><p>Civilization VI through a tool interface such as civ6-mcp, or an open-source relative such as Freeciv or Unciv.</p></div></div>
</div>
<figcaption><strong>Figure 4.</strong> A layered agent for Civilization. The expensive language model works where knowledge and judgement matter and decisions are few; fast rules, search or learned policies handle the many small moves. Vox Deorum uses a two-layer version of this design for Civilization V, with Vox Populi’s AI carrying out the language model’s strategy.</figcaption>
</figure>

Adoption also means changing course. A good player drops a science plan when a neighbour starts a war. An agent has to notice such moments, which means keeping track of what has changed over a very long game, and CivBench shows how rarely agents look.

## Creating new strategies

The most interesting question is whether an agent can invent strategies that people have not thought of. In Go, AlphaGo’s 37th move in its second game against Lee Sedol was one that, by [DeepMind’s estimate](https://blog.google/innovation-and-ai/products/what-we-learned-in-seoul-with-alphago/), a human player would choose only about one time in 10,000. It helped AlphaGo win the game and, in [DeepMind’s words](https://deepmind.google/research/alphago/), “upended centuries of traditional wisdom”. Training through self-play and search had found an idea outside human practice.

In a game as large as Civilization, there are two main ways to look for new strategies:

- **Search and self-play** explore the space of possible play directly. Methods that reward diversity, not only winning, keep the search from settling too early on one style of play.
- **Language models as idea generators** propose strategies in words (“delay the second city and rush a wonder”). Each idea is then tested in many simulated games, and the ones that win are kept. The model brings variety, and the simulation acts as the referee. FunSearch, from Google DeepMind, used this loop in mathematics: a language model proposed programs, an automatic evaluator scored them, and the best were kept and improved, which produced new constructions for the cap set problem.

Either way, a new strategy only counts if it holds up against strong, adaptive opponents, not just against a fixed built-in AI.

## The challenges

- **Speed and cost.** A full game has hundreds of turns, each with many decisions. In CivBench a single game cost up to $229 and took up to eight hours. In the 2011 study, a 100-step game took about an hour and a half, because the agent simulated 500 short look-ahead games before every move, and a full game could take days. Reinforcement learning needs far more games than that.
- **Access.** Civilization VI has no official interface for agents. Tools such as civ6-mcp reach in through the game’s debugging port, which accepts only one connection at a time, and you need your own copy of the game and its Gathering Storm expansion. The open-source relatives are free and scriptable, but they differ from the real game.
- **Attention and memory.** A game of about 300 turns produces far more information than a model can keep in view, so an agent has to decide what to look up. CivBench’s agents rarely checked who was about to win and often did not carry out their own plans.
- **Spatial and numerical reasoning.** Hex maps, adjacency bonuses and yield calculations demand the kind of spatial and numerical reasoning that language models still often get wrong. The authors of CivAgent, a language-model player for Unciv, name numerical reasoning and long-term planning as key challenges.
- **Sensitivity to framing.** In [my research on the LLM Belief Atlas](../../papers/2026-001/) I measured how much a model’s stated opinions depend on how a question is asked. A game agent’s decisions are likely just as sensitive to how the game state is written down, so two descriptions of the same position may lead to different plans.
- **Evaluation.** CivBench is a first step towards a shared benchmark for the real game, but, as its authors say, 23 games are too few to rank models. Beating the built-in AI also says little about skill, since its higher levels add bonuses rather than better play, and results depend on maps, civilizations, difficulty and game version.
- **Diplomacy and trust.** Negotiation requires understanding what other players want and keeping promises. Agents that learn to bluff or deceive in games raise questions that matter beyond games.

## Potential pathways

- **Hybrid agents.** Let a language model choose the victory path and set goals, and leave unit moves and city management to fast rules or learned controllers. The expensive model is then used where it adds the most. Vox Deorum shows that this already works: in its 2025 study, the language-model strategists won about as often as Vox Populi’s strong algorithmic AI, and in October 2026 the project reported that the best model on its leaderboard now rates well above that AI.
- **Better environments.** Open, fast and faithful simulators, such as Freeciv-based platforms, alongside tool interfaces to the real game such as civ6-mcp, with fixed maps and random seeds so that results can be compared and reproduced.
- **Harnesses that keep agents on track.** CivBench’s agents had the tools and the advice but often did not use them. A harness could schedule the checks and track the commitments itself, instead of leaving both to the model.
- **Strategy libraries.** Store strategies as reusable plans or code, as Voyager did with skills in Minecraft, and grow the library from experience, guides and reflection.
- **Learning from people.** Build on the decades of strategy that players have written down and recorded, as the manual-reading agent of 2011 did on a small scale.
- **Searching for new ideas.** Pair language models that propose strategies with simulations that test them, as FunSearch did in mathematics, and reward diversity so that the search does not keep rediscovering the same plan.
- **Agents that explain themselves.** An agent that can say why it chose a plan is easier to debug and easier to trust, and it is more useful as a coach for human players.

## Where this leaves us

Civilization VI is not just a bigger Go. It asks an agent to plan over hundreds of turns, juggle competing goals, read other players and change its mind at the right moment. The agents tested so far can play full games of the real thing and occasionally win, but they often lose track of what matters and of what they meant to do. Inventing genuinely new strategies, and holding up against strong human players, is still ahead. The most promising path combines what each approach does best: the knowledge and reasoning of language models, the precision of search and the relentless practice of reinforcement learning.

## Code to explore

### Environments and interfaces

| Repository | What it is |
| --- | --- |
| [lmwilki/civ6-mcp](https://github.com/lmwilki/civ6-mcp) | An MCP server that lets language-model agents play full games of Civilization VI; the environment behind CivBench. |
| [freeciv/freeciv](https://github.com/freeciv/freeciv) | Freeciv, the open-source empire-building game inspired by Civilization. |
| [freeciv/freeciv-web](https://github.com/freeciv/freeciv-web) | Freeciv in the browser, the basis of CivRealm. |
| [bigai-ai/civrealm](https://github.com/bigai-ai/civrealm) | CivRealm, a Freeciv environment for reinforcement-learning and language-model agents. |
| [yairm210/Unciv](https://github.com/yairm210/Unciv) | Unciv, an open-source remake of Civilization V for Android and desktop. |
| [GAIGResearch/Tribes](https://github.com/GAIGResearch/Tribes) | Tribes, an open implementation of The Battle of Polytopia for AI research. |
| [google-deepmind/pysc2](https://github.com/google-deepmind/pysc2) | PySC2, DeepMind’s Python component of the StarCraft II Learning Environment. |

### Agents and methods

| Repository | What it is |
| --- | --- |
| [vox-deorum/vox-deorum](https://github.com/vox-deorum/vox-deorum) | Vox Deorum, which lets language models play Civilization V by setting strategy for Vox Populi’s AI. |
| [fuxiAIlab/CivAgent](https://github.com/fuxiAIlab/CivAgent) | CivAgent, a language-model “digital player” for Unciv. Its README says the project moved to asdqsczser/CivAgent in March 2025. |
| [ysymyth/ReAct](https://github.com/ysymyth/ReAct) | ReAct, prompting that interleaves reasoning and actions. |
| [noahshinn/reflexion](https://github.com/noahshinn/reflexion) | Reflexion, agents that improve through written self-reflection. |
| [MineDojo/Voyager](https://github.com/MineDojo/Voyager) | Voyager, a Minecraft agent with a growing library of skills written as code. |
| [google-deepmind/funsearch](https://github.com/google-deepmind/funsearch) | FunSearch’s discovered programs, and a single-threaded version of its propose-and-test loop. |
| [facebookresearch/diplomacy_cicero](https://github.com/facebookresearch/diplomacy_cicero) | Code for CICERO, the Diplomacy agent (archived). |
| [balrog-ai/BALROG](https://github.com/balrog-ai/BALROG) | BALROG, a benchmark of language-model agents in games. |

## Further reading

- M. Campbell, A. J. Hoane Jr. and F. Hsu (2002). [Deep Blue](https://doi.org/10.1016/S0004-3702(01)00129-1). *Artificial Intelligence*.
- S. R. K. Branavan, D. Silver and R. Barzilay (2011). [Learning to win by reading manuals in a Monte-Carlo framework](https://aclanthology.org/P11-1028/). ACL.
- D. Silver et al. (2016). [Mastering the game of Go with deep neural networks and tree search](https://doi.org/10.1038/nature16961). *Nature*.
- O. Vinyals et al. (2019). [Grandmaster level in StarCraft II using multi-agent reinforcement learning](https://doi.org/10.1038/s41586-019-1724-z). *Nature*.
- C. Berner et al. (2019). [Dota 2 with large scale deep reinforcement learning](https://arxiv.org/abs/1912.06680). arXiv.
- Meta Fundamental AI Research Diplomacy Team (FAIR) et al. (2022). [Human-level play in the game of Diplomacy by combining language models with strategic reasoning](https://doi.org/10.1126/science.ade9097). *Science*.
- S. Yao et al. (2023). [ReAct: Synergizing reasoning and acting in language models](https://arxiv.org/abs/2210.03629). ICLR.
- N. Shinn et al. (2023). [Reflexion: Language agents with verbal reinforcement learning](https://arxiv.org/abs/2303.11366). NeurIPS.
- G. Wang et al. (2024). [Voyager: An open-ended embodied agent with large language models](https://arxiv.org/abs/2305.16291). *Transactions on Machine Learning Research*.
- B. Romera-Paredes et al. (2024). [Mathematical discoveries from program search with large language models](https://doi.org/10.1038/s41586-023-06924-6). *Nature*.
- S. Qi et al. (2024). [CivRealm: A learning and reasoning odyssey in Civilization for decision-making agents](https://arxiv.org/abs/2401.10568). ICLR.
- D. Paglieri et al. (2025). [BALROG: Benchmarking agentic LLM and VLM reasoning on games](https://arxiv.org/abs/2411.13543). ICLR.
- J. Wang et al. (2025). [Digital Player: Evaluating large language models based human-like agent in games](https://arxiv.org/abs/2502.20807). arXiv.
- J. Chen et al. (2025). [Vox Deorum: A hybrid LLM architecture for 4X / grand strategy game AI – Lessons from Civilization V](https://arxiv.org/abs/2512.18564). arXiv.
- J. Chen, S. Cheng, C. Gurkan and M. Lin (2026). [CivBench: Progress-based evaluation for LLMs’ strategic decision-making in Civilization V](https://arxiv.org/abs/2604.07733). COLM.
- A. T. D. Andrews, L. Wilkinson et al. (2026). [CivBench: A long-horizon benchmark for tool-mediated agents in Civilization VI](https://arxiv.org/abs/2609.02459). NeurIPS, Evaluations and Datasets Track.
