// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { Console } from 'console';
import * as vscode from 'vscode';

interface IDictionary {
    [key: string]: number;
}

interface IDictionaryArray {
    [key: string]: number[];
}

function getSummarizedMetrics(docs: IDictionaryArray)
{
	let data: number[] = [0, 0];
	for (let key in docs)
	{
		data[0] += docs[key][0];
		data[1] += docs[key][1];
	}
	return data;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "devmetrics" is now active!');

	let currentDocNewLineCount: number = 0;
	const docsPrevState: IDictionary = {};
	const docsDelta: IDictionaryArray = {};

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('devmetrics.showData', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user

		const panel = vscode.window.createWebviewPanel(
			'devMetrics', // Identifies the type of the webview.
			'DevMetrics', // Title of the panel displayed to the user
			vscode.ViewColumn.One, // Editor column to show the new webview panel in.
			{} // Webview options.
		  );

		  panel.webview.html = getWebviewContent(getSummarizedMetrics(docsDelta));

		  const updateWebview = () => {

			panel.webview.html = getWebviewContent(getSummarizedMetrics(docsDelta));
		  };
	
		  // Set initial content
		  updateWebview();
	
		  // And schedule updates to the content every second
		  setInterval(updateWebview, 1000);
	});

	if (vscode.window.activeTextEditor?.document.fileName !== undefined 
		&& vscode.window.activeTextEditor?.document.lineCount !== undefined 
		&& vscode.window.activeTextEditor?.document.fileName in Object.keys(docsPrevState) === false)
		{
			docsPrevState[vscode.window.activeTextEditor?.document.fileName as string] = vscode.window.activeTextEditor?.document.lineCount as number;
			docsDelta[vscode.window.activeTextEditor?.document.fileName as string] = [0, 0];
		}

	vscode.window.onDidChangeActiveTextEditor(function(event) {
		if (event?.document.fileName !== undefined 
			&& vscode.window.activeTextEditor?.document.lineCount !== undefined
			&& Object.keys(docsPrevState).includes(event?.document.fileName) === false)
		{
			docsPrevState[event?.document.fileName] = vscode.window.activeTextEditor?.document.lineCount as number;
			docsDelta[vscode.window.activeTextEditor?.document.fileName as string] = [0, 0];
		}
	});

	vscode.workspace.onDidSaveTextDocument(function(event) {
		if (event.lineCount - docsPrevState[event.fileName] > 0)
		{
			docsDelta[event.fileName][0] += event.lineCount - docsPrevState[event.fileName];
		}
		else if (event.lineCount - docsPrevState[event.fileName] < 0)
		{
			docsDelta[event.fileName][1] -= event.lineCount - docsPrevState[event.fileName];
		}
		docsPrevState[event.fileName] = event.lineCount;
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function getWebviewContent(data: number[]) {
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>DevMetrics data</title>
  </head>
  <body>
	  <h1 style="color: green;">Lines of code written during current session: ${data[0]}</h1>
	  <h1 style="color: red;">Lines of code deleted during current session: ${data[1]}</h1>
  </body>
  </html>`;
  }
