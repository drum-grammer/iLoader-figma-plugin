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

  const PADDING = 20;
  let yOffset = 0;
  let maxBoxWidth = getMaxBoxWidth(data);

  for (const extract of data.extracts) {
    const { questionBox, questionNode } = createQuestion(extract, yOffset);
    const answerNodes = createAnswers(extract, yOffset + questionBox.height + 10);

    const wrappingBox = createWrappingBox(questionBox, answerNodes, maxBoxWidth, PADDING);
    figma.currentPage.appendChild(wrappingBox);

    const group = figma.group([wrappingBox, questionBox, questionNode, ...answerNodes], figma.currentPage);
    group.name = extract.question_content;

    yOffset += wrappingBox.height + PADDING;
  }

  figma.closePlugin();
}

function getMaxBoxWidth(data: QuestionnaireData): number {
  let maxWidth = 0;
  for (const extract of data.extracts) {
    const textNode = figma.createText();
    textNode.characters = extract.question_content;
    if (textNode.width > maxWidth) {
      maxWidth = textNode.width;
    }
    for (const answer of extract.answers) {
      textNode.characters = answer;
      if (textNode.width > maxWidth) {
        maxWidth = textNode.width;
      }
    }
  }
  return maxWidth;
}

function createQuestion(extract: AnswerData, yOffset: number) {
  const questionNode = figma.createText();
  questionNode.characters = extract.question_content;

  const questionBox = figma.createRectangle();
  questionBox.resize(questionNode.width + 20, questionNode.height + 10);
  questionBox.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.6, b: 0.8 } }];
  questionBox.y = yOffset;

  questionNode.y = yOffset + 5;

  figma.currentPage.appendChild(questionBox);
  figma.currentPage.appendChild(questionNode);

  return { questionBox, questionNode };
}

function createAnswers(extract: AnswerData, yOffset: number) {
  const answerNodes = [];
  for (const answer of extract.answers) {
    const answerNode = figma.createText();
    answerNode.characters = answer;
    answerNode.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
    answerNode.effects = [{
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.3 },
      offset: { x: 2, y: 2 },
      radius: 2,
      spread: 0,
      visible: true,
      blendMode: "NORMAL"
    }];
    answerNode.y = yOffset;

    figma.currentPage.appendChild(answerNode);
    answerNodes.push(answerNode);

    yOffset += answerNode.height + 5;
  }
  return answerNodes;
}

function createWrappingBox(questionBox: RectangleNode, answerNodes: TextNode[], maxBoxWidth: number, padding: number) {
  const totalHeight = questionBox.height + answerNodes.reduce((acc, node) => acc + node.height + 5, 0);
  const wrappingBox = figma.createRectangle();
  wrappingBox.resize(maxBoxWidth + 2 * padding, totalHeight + 2 * padding);
  wrappingBox.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
  wrappingBox.y = questionBox.y - padding;
  wrappingBox.x = (figma.viewport.bounds.width - (maxBoxWidth + 2 * padding)) / 2;
  return wrappingBox;
}
