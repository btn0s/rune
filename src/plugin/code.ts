import type { CommandMessage, ResponseMessage, StatusMessage } from '@shared/protocol';

if (figma.editorType === 'figma') {
  figma.showUI(__html__);

  figma.ui.onmessage = (msg: CommandMessage) => {
    const response: ResponseMessage = {
      id: msg.id,
      result: { status: 'received', type: msg.type }
    };
    figma.ui.postMessage(response);
  };

  const statusMsg: StatusMessage = {
    type: 'connected',
    message: 'Rune plugin connected'
  };
  figma.ui.postMessage(statusMsg);
}
