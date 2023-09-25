const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<body>
  <input type="text" id="documentKey" placeholder="Document Key" />
  <button onclick="sendDocumentKey()">Submit</button>

  <script>
    function sendDocumentKey() {
      const documentKey = document.getElementById('documentKey').value;
      window.parent.postMessage({ pluginMessage: { type: 'document-key', documentKey } }, '*');
    }
  </script>
</body>
</html>
`;

type AnswerData = {
  question_id: string;
  question_content: string;
  answers: string[];
};

type QuestionnaireData = {
  questionnaire_id: string;
  questionnaire_title: string;
  extracts: AnswerData[];
};

figma.showUI(htmlContent, { width: 240, height: 100 }); // UI를 보여주고 사용자로부터 Document Key를 입력 받습니다.

figma.ui.onmessage = (msg) => {
  if (msg.type === 'document-key') {
    const documentKey = msg.documentKey;
    const url = `https://api-i-loader.52g.studio/data-extracts/key/${documentKey}`; // Document Key를 사용하여 URL을 생성합니다.


    fetch(url)
        .then(response => response.json())
        .then((data: QuestionnaireData) => createTextNodesFromData(data))
        .catch(error => console.error('Error:', error));
  }
};

async function createTextNodesFromData(data: QuestionnaireData) {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  let yOffset = 0;

  for (const extract of data.extracts) {
    const questionNode = figma.createText();
    questionNode.characters = extract.question_content;
    questionNode.y = yOffset;
    figma.currentPage.appendChild(questionNode);

    yOffset += questionNode.height + 10; // 10은 간격입니다.

    for (const answer of extract.answers) {
      const answerNode = figma.createText();
      answerNode.characters = answer;
      answerNode.y = yOffset;
      figma.currentPage.appendChild(answerNode);

      yOffset += answerNode.height + 5; // 5는 간격입니다.
    }

    yOffset += 20; // 각 질문 사이의 추가 간격입니다.
  }

  figma.closePlugin();
}
