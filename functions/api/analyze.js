async function analyze() {
  const text = document.getElementById('jobInput').value.trim();
  if (!text) return;
  const jobTitle = document.getElementById('jobTitle').value.trim();

  const btn = document.getElementById('analyzeBtn');
  btn.disabled = true;
  document.getElementById('thinking').style.display = 'flex';
  document.getElementById('results').style.display = 'none';
  document.getElementById('errorBox').style.display = 'none';

  // FIX 1: Initialize searchCount to prevent "Analysis failed"
  let searchCount = 0; 

  const investigationSteps = [
    { label: 'Reading the job posting',    detail: 'Pulling apart the text for company name, pay, requirements...' },
    { label: 'Searching for the company',   detail: "Looking up the company's real website and careers page..." },
    { label: 'Checking if the role is listed',  detail: "Comparing the posting to what's actually on their site..." },
    { label: 'Scoring fraud signals',           detail: 'Running all filters and calculating your risk score...' }
  ];

  function renderProgress(step, detail) {
    const container = document.getElementById('progressSteps');
    container.innerHTML = investigationSteps.map((s, i) => {
      const isDone = i < step;
      const isActive = i === step;
      const cls = isDone ? 'done' : isActive ? 'active' : '';
      const icon = isDone ? '✓' : String(i + 1);
      return '<div class="progress-step ' + cls + '">' +
        '<div class="step-icon">' + icon + '</div>' +
        '<span>' + s.label + '</span></div>';
    }).join('');
    document.getElementById('thinkingDetail').textContent = detail || investigationSteps[Math.min(step, investigationSteps.length - 1)].detail;
  }

  renderProgress(0, investigationSteps[0].detail);

  try {
    let messages = [{
      role: 'user',
      content: (jobTitle ? 'Job Title: ' + jobTitle + '\n\n' : '') +
        `Before scoring, extract the company name. Use web_search to find "[company] careers" and "[company] jobs". Check: (1) does the company have a real careers page, (2) is this role listed. If no careers page or role not found, increase fraudRiskScore by 40 (cap 100). Note findings in redFlags or greenFlags. If no company name, note as red flag.\n\nJob posting:\n\n` + text
    }];

    let finalText = null;

    // Loop to handle the "Thought -> Tool -> Result -> Final Answer" cycle
    while (!finalText) {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          system: SYSTEM_PROMPT,
          messages
        })
      });

      const data = await response.json();
      
      // Handle API Errors
      if (data.error) throw new Error(data.error);

      const responseContent = data.content || [];
      const toolUseBlock = responseContent.find(b => b.type === 'tool_use');
      const textBlock = responseContent.find(b => b.type === 'text');
      const stopReason = data.stop_reason;

      if (stopReason === 'end_turn' && textBlock) {
        renderProgress(3, 'Scoring fraud signals and building your report...');
        finalText = textBlock.text;
      } else if (toolUseBlock) {
        searchCount++;
        renderProgress(Math.min(searchCount, 2));
        // Append assistant turn to history to keep context for the next loop
        messages = [...messages, { role: 'assistant', content: responseContent }];
        
        // Note: In a real production environment, you would execute the tool here 
        // and add the 'tool_result' to messages. Since your worker handles tools 
        // via Anthropic's beta, we proceed to the next loop.
      } else if (textBlock) {
        finalText = textBlock.text;
      } else {
        throw new Error('Unexpected response structure from API');
      }
    }

    // FIX 2: Robust "Greedy" JSON Extractor
    function extractJSON(str) {
      // Remove markdown and whitespace
      const cleaned = str.replace(/```json/gi, '').replace(/```/g, '').trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      
      if (start === -1 || end === -1) {
          console.error("Failed to find JSON in text:", str);
          throw new Error('No JSON object found in response');
      }
      
      return JSON.parse(cleaned.substring(start, end + 1));
    }

    const parsed = extractJSON(finalText);
    renderResults(parsed);

  } catch (err) {
    console.error("Analysis Error:", err);
    document.getElementById('errorBox').textContent = 'Analysis failed — please try again. ' + (err.message || '');
    document.getElementById('errorBox').style.display = 'block';
  } finally {
    document.getElementById('thinking').style.display = 'none';
    btn.disabled = false;
  }
}
