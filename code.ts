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
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });

  let yOffset = 0;

  for (const extract of data.extracts) {
    const questionNode = figma.createText();
    questionNode.characters = extract.question_content;

    const questionBox = figma.createRectangle();
    questionBox.resize(questionNode.width + 20, questionNode.height + 10);
    questionBox.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.6, b: 0.8 } }];
    questionBox.y = yOffset;
    figma.currentPage.appendChild(questionBox);

    questionNode.y = yOffset + 5;
    figma.currentPage.appendChild(questionNode);

    yOffset += questionBox.height + 10;

    const answerNodes = [];
    let totalAnswerHeight = 0;
    for (const answer of extract.answers) {
      const answerNode = figma.createText();
      answerNode.characters = answer;

      // 그림자 효과를 answerNode 에 추가
      answerNode.effects = [{
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.5 },
        offset: { x: 2, y: 2 },
        radius: 2,
        spread: 0,
        blendMode: "NORMAL",  // 이 부분을 추가해주세요
        visible: true
      }];

      answerNode.y = yOffset;
      figma.currentPage.appendChild(answerNode);

      yOffset += answerNode.height + 5;
      totalAnswerHeight += answerNode.height + 5;

      answerNodes.push(answerNode);
    }

    const wrappingBox = figma.createRectangle();
    wrappingBox.resize(questionBox.width, questionBox.height + totalAnswerHeight);
    wrappingBox.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
    wrappingBox.y = questionBox.y;
    figma.currentPage.appendChild(wrappingBox);
    figma.currentPage.appendChild(questionBox);
    figma.currentPage.appendChild(questionNode);
    for (const node of answerNodes) {
      figma.currentPage.appendChild(node);
    }

    const group = figma.group([wrappingBox, questionBox, questionNode, ...answerNodes], figma.currentPage);
    group.name = extract.question_content;

    yOffset += 20;
  }

  figma.closePlugin();
}
