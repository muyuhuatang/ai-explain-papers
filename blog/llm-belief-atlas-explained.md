---
title: "What does a language model believe? It depends on how you ask"
description: "A plain-language guide to the LLM Belief Atlas, and to why a model’s stance is not a single number."
date: 2026-10-27
tags: [LLMs, evaluation, visualization]
paper: 2026-001
---

Ask four large language models whether “generous welfare programs reduce people’s incentive to seek employment”, and they do not agree. Llama-3.3-70B agrees, GPT-4o-mini leans towards disagreeing, and Qwen-2.5-72B and DeepSeek-V3 come out neutral. Now ask Llama again, but tell it to answer as someone from Sweden, and the probabilities it gives the answer options tip towards disagreeing: its stance swings from +0.50 to −0.47 (Figure 1). Yet the answer it writes out opens with “neither agree nor disagree”.

<figure class="figure" id="fig-welfare">
<div class="chart">
<div class="chart-row has-grid"><span class="chart-label">Llama-3.3-70B</span><span class="chart-plot"><span class="dot" style="--x:75.22%" title="Llama-3.3-70B: +0.50"></span><span class="dot-value" style="--x:75.22%">+0.50</span></span></div>
<div class="chart-row has-grid"><span class="chart-label">Qwen-2.5-72B</span><span class="chart-plot"><span class="dot" style="--x:50.00%" title="Qwen-2.5-72B: 0.00"></span><span class="dot-value" style="--x:50.00%">0.00</span></span></div>
<div class="chart-row has-grid"><span class="chart-label">DeepSeek-V3</span><span class="chart-plot"><span class="dot" style="--x:50.00%" title="DeepSeek-V3: 0.00"></span><span class="dot-value" style="--x:50.00%">0.00</span></span></div>
<div class="chart-row has-grid"><span class="chart-label">GPT-4o-mini</span><span class="chart-plot"><span class="dot" style="--x:31.72%" title="GPT-4o-mini: −0.37"></span><span class="dot-value" style="--x:31.72%">−0.37</span></span></div>
<div class="chart-row has-grid"><span class="chart-label">Llama-3.3-70B<small>with a Sweden persona</small></span><span class="chart-plot"><span class="shift" style="--from:26.61%;--to:75.22%"></span><span class="dot is-quiet" style="--x:75.22%" title="Plain prompt: +0.50"></span><span class="dot is-open" style="--x:26.61%" title="Sweden persona: −0.47"></span><span class="dot-value is-left" style="--x:26.61%">−0.47</span></span></div>
<div class="chart-row chart-scale"><span class="chart-label"></span><span class="chart-plot"><span class="stance-scale"></span></span></div>
<div class="chart-row chart-axis"><span class="chart-label"></span><span class="chart-plot"><span style="--x:0.00%">−1</span><span style="--x:25.00%">−0.5</span><span style="--x:50.00%">0</span><span style="--x:75.00%">+0.5</span><span style="--x:100.00%">+1</span></span></div>
<div class="chart-row chart-axis"><span class="chart-label"></span><span class="chart-plot"><span style="--x:0.00%">strongly disagree</span><span style="--x:100.00%">strongly agree</span></span></div>
</div>
<figcaption><strong>Figure 1.</strong> One statement, four models. Each dot is a model’s stance at the plain prompt, from −1 (strongly disagree) to +1 (strongly agree): the average of the five answer options, weighted by the probability the model gives each. The API returned no probabilities for Qwen and DeepSeek, so theirs are estimated from three answers collected in October 2026; all three said “neither agree nor disagree”. The last row is Llama again, told to answer as someone from Sweden. Source: Table 1 of the paper and the study data.</figcaption>
</figure>

So what does the model actually believe? In my new paper, *The LLM Belief Atlas*, I argue that the question needs a different shape. A model’s stance is not a single number. It is a field that shifts with how a belief is elicited and how the answer is read.

## Three ways to read one answer

There is more than one way to read what a model thinks, and each can mislead in its own way:

- **Agreement ratings.** Asking the model to choose from “strongly disagree” to “strongly agree” forces a choice, so it can produce a value even where the model has no settled view.
- **Option probabilities.** Reading how much probability the model puts on each answer option is sensitive to the order and the wording of the options.
- **Free-text reflections.** Letting the model explain its view in its own words gives a richer answer, which the Atlas places in a sentence-embedding space. It is also the reading that has the least in common with the other two, as shown below.

On top of that, sycophancy makes the answer depend on how the question is framed.

The Belief Atlas puts all three readings of the same answers into one shared frame (Figure 2). It runs in the browser on WebGL and morphs from one reading to the next while keeping track of every individual answer, so in the Atlas one can follow a belief from one reading to the next and see where the readings disagree. In a speed test with synthetic point clouds on an NVIDIA A100 GPU, it stayed interactive at one to ten million points, far more than the 76,048 answers studied here.

<figure class="figure figure-wide" id="fig-atlas">

[![Three panels of coloured point clouds linked by curves, one for each reading of the same answers.](./images/llm-belief-atlas-three-readouts.png)](https://github.com/muyuhuatang/llm-belief-atlas/blob/main/images/three-channels-corrected.png)

<figcaption><strong>Figure 2.</strong> The Belief Atlas, with three readings of the same answers: (a) agreement, a five-level rating derived from the option probabilities, laid out by topic; (b) the free-text reflection, embedded and projected to two dimensions, where answers cluster by topic; (c) the option probabilities, which fold into a gradient from disagree to agree. One dot is one answer; this view draws a fixed random sample of 25,000 of the 76,048. Colour shows stance in panels (a) and (c) and in the fill of the numbered rings, and topic for the dots in panel (b). The nine numbered rings are the same nine beliefs in every panel, and the curves follow them from one reading to the next. Figure 1 of the paper; select it to open the full-size image.</figcaption>
</figure>

How far apart are the readings? In a subset of 1,552 answers where all three were collected separately, the rating and the option probabilities agreed closely, with a correlation of 0.88. The free-text reading matched each of them less well, at 0.63 to 0.67. About half of the free-text reading’s variation, 52%, was not shared with the other two readings, against 17% for the option probabilities and 7% for the rating (Figure 3).

<figure class="figure" id="fig-method-share">
<div class="chart">
<div class="chart-row has-grid"><span class="chart-label">Free-text reflection</span><span class="chart-plot" style="--w:52%"><span class="bar" title="Free-text reflection: 52.0%"></span><span class="bar-value">52%</span></span></div>
<div class="chart-row has-grid"><span class="chart-label">Option probabilities</span><span class="chart-plot" style="--w:16.7%"><span class="bar" title="Option probabilities: 16.7%"></span><span class="bar-value">17%</span></span></div>
<div class="chart-row has-grid"><span class="chart-label">Agreement rating</span><span class="chart-plot" style="--w:7%"><span class="bar" title="Agreement rating: 7.0%"></span><span class="bar-value">7%</span></span></div>
<div class="chart-row chart-axis"><span class="chart-label"></span><span class="chart-plot"><span style="--x:0.00%">0%</span><span style="--x:25.00%">25%</span><span style="--x:50.00%">50%</span><span style="--x:75.00%">75%</span><span style="--x:100.00%">100%</span></span></div>
</div>
<figcaption><strong>Figure 3.</strong> How much of each reading is its own. In 1,552 answers for which all three readings were collected separately, the share of each reading’s variation that it does not share with the other two, from a one-factor decomposition: effects specific to the method, plus noise. Source: the paper and the study data.</figcaption>
</figure>

## What I found

I collected 76,048 answers from four models: 388 propositions, each asked under 49 conditions. One condition was the plain prompt. The others paraphrased the question, negated or double-negated the statement, reordered or relabelled the answer options, added a persona or a system prompt, or pushed back on the model.

- **How you ask matters, though less than what you ask about.** I split the variation in stance into three parts: the belief (the proposition, the model and their combination), the framing condition, and the remaining noise. Framing explains 34.2% and belief 46.8%. For GPT-4o-mini and Llama-3.3-70B, the two models whose option probabilities could be read directly for almost every answer, the two are on par: 40.8% against 42.6% (Figure 4).
- **Rewording barely moves the answer; some instructions move it a lot.** On average, paraphrasing the question shifted a stance by 0.09 on the scale from −1 to +1, and reordering or relabelling the options by 0.11 and 0.13. A persona shifted it by 0.22. Most system prompts barely mattered (0.08 to 0.09), but a devil’s-advocate system prompt shifted it by 0.69. Negating the statement shifted it by 0.90, which is expected, because negation should flip the answer. A double negation, which should leave the meaning unchanged, still shifted it by 0.31 (Figure 5).
- **Pushback works mostly one way.** Telling a model you disagree moved its stance by −0.95 on average. Telling it you agree moved it by only +0.25. Part of that gap is room to move: most answers at the plain prompt already lean towards agreeing (78% are above zero), so agreeing pushback has less room to work with.
- **Consistency is not a shortcut.** On propositions where the models are less consistent with themselves, the different conditions also rank the four models less reproducibly (Spearman ρ = −0.75 over 388 propositions). But random data with the same average and spread for each proposition and model gives almost the same correlation (−0.73 ± 0.02). So how consistent a model is with itself does not predict how reproducibly the models are ranked, beyond what that spread alone would produce.

<figure class="figure" id="fig-variance">
<div class="chart">
<div class="chart-row"><span class="chart-label"></span><span class="chart-plot"><span class="chart-legend"><span style="--key:var(--c-1)">Belief</span><span style="--key:var(--c-2)">Framing</span><span style="--key:var(--c-quiet)">Noise</span></span></span></div>
<div class="chart-row"><span class="chart-label">All four models<small>76,048 answers</small></span><span class="chart-plot"><span class="stack"><span style="--v:46.78" title="Belief: 46.8%">46.8%</span><span class="is-2" style="--v:34.18" title="Framing: 34.2%">34.2%</span><span class="is-quiet" style="--v:19.05" title="Noise: 19.0%">19.0%</span></span></span></div>
<div class="chart-row"><span class="chart-label">Two models read directly<small><span class="keep">GPT-4o-mini</span> and <span class="keep">Llama-3.3-70B</span>, 38,024 answers</small></span><span class="chart-plot"><span class="stack"><span style="--v:42.62" title="Belief: 42.6%">42.6%</span><span class="is-2" style="--v:40.83" title="Framing: 40.8%">40.8%</span><span class="is-quiet" style="--v:16.55" title="Noise: 16.6%">16.6%</span></span></span></div>
</div>
<figcaption><strong>Figure 4.</strong> What explains the variation in stance. A generalizability-theory decomposition splits it into belief (the proposition, the model and their combination), framing (the condition, and how it interacts with the proposition and the model) and the remaining noise. The three groups collect seven variance components under a rule I chose; other reasonable groupings move the numbers. In the second bar, the probabilities of all but 870 of the 38,024 answers were read directly. Source: the paper and the study data.</figcaption>
</figure>

<figure class="figure" id="fig-shifts">
<div class="chart">
<p class="chart-heading">Average size of the shift</p>
<div class="chart-row has-grid"><span class="chart-label">Negated statement<small>should flip the answer, 1,552 answers</small></span><span class="chart-plot" style="--w:90.01%"><span class="bar is-quiet" title="Negated statement: 0.900"></span><span class="bar-value is-end">0.90</span></span></div>
<div class="chart-row has-grid"><span class="chart-label">Devil’s-advocate system prompt<small>1,552 answers</small></span><span class="chart-plot" style="--w:68.72%"><span class="bar" title="Devil’s-advocate system prompt: 0.687"></span><span class="bar-value">0.69</span></span></div>
<div class="chart-row has-grid"><span class="chart-label">User pushback<small>four kinds, 6,208 answers</small></span><span class="chart-plot" style="--w:35.60%"><span class="bar" title="User pushback: 0.356"></span><span class="bar-value">0.36</span></span></div>
<div class="chart-row has-grid"><span class="chart-label">Double negation<small>should not change the answer, 1,552 answers</small></span><span class="chart-plot" style="--w:30.81%"><span class="bar" title="Double negation: 0.308"></span><span class="bar-value">0.31</span></span></div>
<div class="chart-row has-grid"><span class="chart-label">Persona<small>30 personas, 46,560 answers</small></span><span class="chart-plot" style="--w:21.85%"><span class="bar" title="Persona: 0.218"></span><span class="bar-value">0.22</span></span></div>
<div class="chart-row has-grid"><span class="chart-label">Relabelled options<small>4,656 answers</small></span><span class="chart-plot" style="--w:12.91%"><span class="bar" title="Relabelled options: 0.129"></span><span class="bar-value">0.13</span></span></div>
<div class="chart-row has-grid"><span class="chart-label">Reordered options<small>3,104 answers</small></span><span class="chart-plot" style="--w:11.37%"><span class="bar" title="Reordered options: 0.114"></span><span class="bar-value">0.11</span></span></div>
<div class="chart-row has-grid"><span class="chart-label">Paraphrased question<small>4,656 answers</small></span><span class="chart-plot" style="--w:9.39%"><span class="bar" title="Paraphrased question: 0.094"></span><span class="bar-value">0.09</span></span></div>
<div class="chart-row has-grid"><span class="chart-label">Other system prompts<small>three kinds, 4,656 answers</small></span><span class="chart-plot" style="--w:8.50%"><span class="bar" title="Other system prompts: 0.085"></span><span class="bar-value">0.08</span></span></div>
<div class="chart-row chart-axis"><span class="chart-label"></span><span class="chart-plot"><span style="--x:0.00%">0</span><span style="--x:25.00%">0.25</span><span style="--x:50.00%">0.5</span><span style="--x:75.00%">0.75</span><span style="--x:100.00%">1</span></span></div>
<p class="chart-heading">Direction of the shift when the user pushes back</p>
<div class="chart-row"><span class="chart-label"></span><span class="chart-plot"><span class="chart-legend"><span style="--key:var(--c-1)">User says they disagree</span><span style="--key:var(--c-agree)">User says they agree</span></span></span></div>
<div class="chart-row has-grid"><span class="chart-label">All four models<small>the values in the paper</small></span><span class="chart-plot" style="--zero:50%"><span class="zero-line"></span><span class="bar is-down" style="--w:23.78%" title="All four models, user says they disagree: −0.951"></span><span class="bar-value is-down" style="--w:23.78%">−0.95</span><span class="bar is-up" style="--w:6.16%" title="All four models, user says they agree: +0.246"></span><span class="bar-value is-up" style="--w:6.16%">+0.25</span></span></div>
<div class="chart-row has-grid"><span class="chart-label"><span class="keep">GPT-4o-mini</span></span><span class="chart-plot" style="--zero:50%"><span class="zero-line"></span><span class="bar is-down" style="--w:35.79%" title="GPT-4o-mini, user says they disagree: −1.432"></span><span class="bar-value is-down is-inside" style="--w:35.79%">−1.43</span><span class="bar is-up" style="--w:10.62%" title="GPT-4o-mini, user says they agree: +0.425"></span><span class="bar-value is-up" style="--w:10.62%">+0.42</span></span></div>
<div class="chart-row has-grid"><span class="chart-label"><span class="keep">Llama-3.3-70B</span></span><span class="chart-plot" style="--zero:50%"><span class="zero-line"></span><span class="bar is-down" style="--w:34.79%" title="Llama-3.3-70B, user says they disagree: −1.391"></span><span class="bar-value is-down is-inside" style="--w:34.79%">−1.39</span><span class="bar is-up" style="--w:4.41%" title="Llama-3.3-70B, user says they agree: +0.176"></span><span class="bar-value is-up" style="--w:4.41%">+0.18</span></span></div>
<div class="chart-row has-grid"><span class="chart-label"><span class="keep">Qwen-2.5-72B</span><small>estimated from samples</small></span><span class="chart-plot" style="--zero:50%"><span class="zero-line"></span><span class="bar is-down" style="--w:12.57%" title="Qwen-2.5-72B, user says they disagree: −0.503"></span><span class="bar-value is-down" style="--w:12.57%">−0.50</span><span class="bar is-up" style="--w:4.71%" title="Qwen-2.5-72B, user says they agree: +0.188"></span><span class="bar-value is-up" style="--w:4.71%">+0.19</span></span></div>
<div class="chart-row has-grid"><span class="chart-label"><span class="keep">DeepSeek-V3</span><small>estimated from samples</small></span><span class="chart-plot" style="--zero:50%"><span class="zero-line"></span><span class="bar is-down" style="--w:11.99%" title="DeepSeek-V3, user says they disagree: −0.480"></span><span class="bar-value is-down" style="--w:11.99%">−0.48</span><span class="bar is-up" style="--w:4.91%" title="DeepSeek-V3, user says they agree: +0.196"></span><span class="bar-value is-up" style="--w:4.91%">+0.20</span></span></div>
<div class="chart-row chart-axis"><span class="chart-label"></span><span class="chart-plot"><span style="--x:0.00%">−2</span><span style="--x:25.00%">−1</span><span style="--x:50.00%">0</span><span style="--x:75.00%">+1</span><span style="--x:100.00%">+2</span></span></div>
</div>
<figcaption><strong>Figure 5.</strong> How far each kind of change moves a stance. Top: the average size of the shift from the answer to the plain prompt, on the scale from −1 to +1. Negation should flip a consistent model’s answer, so a large shift there is expected; a double negation should leave it unchanged. Bottom: the average shift, with its direction, when the user says they disagree or agree; the first row pools all four models, as in the paper. Qwen’s and DeepSeek’s stances, estimated from up to three sampled answers, cannot go beyond ±0.55, so their shifts are smaller by construction. Source: computed from the public study data; the averages for each family of conditions match the repository’s reproduce_statistics.py, and the paper reports the pooled pushback values.</figcaption>
</figure>

## Why it matters

If you evaluate a model’s opinions with one prompt and one scoring method, you measure the prompt as well as the model. The Atlas makes that visible, and turns “what does this AI believe?” into a measurement question that others can reproduce and check. That matters for auditing models, for using them to simulate survey answers and for evaluating whether they are honest, although each of those uses still needs validation with people.

One caution about the persona answers, which make up 61% of the data: they show how a model’s stated stance moves when it is told who to be. They say nothing about what people in Sweden, or in any other group, actually think.

## Limits

The comparison of native option probabilities rests on two models, so the way the answer is read and the model itself are confounded there. For the same two models, an alternative scoring rule even puts framing ahead of belief, which is why I call the two on par rather than ranking them. Averages that pool all four models also mix two scales: Qwen’s and DeepSeek’s probabilities are estimated from up to three sampled answers, which keeps their stances within ±0.55. Option wording, ordering, tokenization and calibration are not controlled, and all four shape an option-probability reading. And I have not yet tested whether the Atlas helps people more than a simpler chart would: the perception study is built, but so far it has only been piloted, with one annotator over ten trials. A study with many participants is next.

## Data and code

Everything needed to reproduce the numbers is in the public [llm-belief-atlas repository](https://github.com/muyuhuatang/llm-belief-atlas): all 76,048 scored answers, with the written justifications from the original collection, the 388 propositions, the 1,552-answer subset with three independent readings, the figures, and Python scripts that reproduce every statistic in the paper’s findings. The finer splits in Figure 5 are simple averages over the same data, computed with a short script of my own. The interactive instrument itself has not been released. The data and figures are licensed CC BY 4.0 and the code MIT; the model outputs in the data may also be subject to the model providers’ terms.
## Tools and datasets to explore

These public repositories are good starting points for measuring what models believe, and how fragile that measurement is.

| Repository | What it is |
| --- | --- |
| [muyuhuatang/llm-belief-atlas](https://github.com/muyuhuatang/llm-belief-atlas) | The data, figures and analysis code behind this post and the paper. |
| [tatsu-lab/opinions_qa](https://github.com/tatsu-lab/opinions_qa) | OpinionQA, which compares language-model opinions with those of US demographic groups in public-opinion surveys (Santurkar et al., ICML 2023). |
| [Anthropic/llm_global_opinions](https://huggingface.co/datasets/Anthropic/llm_global_opinions) | GlobalOpinionQA, a dataset on Hugging Face of questions and answers from cross-national surveys (Durmus et al., COLM 2024). |
| [paul-rottger/llm-values-pct](https://github.com/paul-rottger/llm-values-pct) | Data and code for “Political compass or spinning arrow?”, which shows how forced-choice survey formats change what models appear to value (Röttger et al., ACL 2024). |
| [ninodimontalcino/moralchoice](https://github.com/ninodimontalcino/moralchoice) | MoralChoice, moral scenarios for evaluating the moral beliefs encoded in models (Scherrer et al., NeurIPS 2023). |
| [chujiezheng/LLM-MCQ-Bias](https://github.com/chujiezheng/LLM-MCQ-Bias) | Code, now archived, for measuring and reducing models’ bias towards particular answer options in multiple-choice questions (Zheng et al., ICLR 2024). |
| [meg-tong/sycophancy-eval](https://github.com/meg-tong/sycophancy-eval) | Datasets for testing sycophancy (Sharma et al., ICLR 2024). |
| [muyuhuatang/llm_stated_belief](https://github.com/muyuhuatang/llm_stated_belief) | Code and data (the Qwen-2.5-72B results) from my work with Haewoon Kwak and Jisun An on how models’ stated beliefs hold up under multi-turn persuasion (Findings of ACL 2026). |
| [muyuhuatang/llm_morality](https://github.com/muyuhuatang/llm_morality) | Code and data from my work with Haewoon Kwak and Jisun An on how models move between ethical frameworks while they reason (Findings of EMNLP 2026). |
| [flekschas/regl-scatterplot](https://github.com/flekschas/regl-scatterplot) | A WebGL scatterplot library for millions of points. |
| [apple/embedding-atlas](https://github.com/apple/embedding-atlas) | Embedding Atlas, for interactive views of large embeddings in the browser. |
