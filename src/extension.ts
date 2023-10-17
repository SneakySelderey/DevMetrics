// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { Console } from 'console';
import * as vscode from 'vscode';

interface IDictionary {
    [key: string]: number;
}

function getSummarizedMetrics(docs: IDictionary)
{
	let lineCountDelta = 0;
	for (let key in docs)
	{
		console.log(key + " " + docs[key]);
		lineCountDelta += docs[key];
	}
	return lineCountDelta;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "devmetrics" is now active!');

	let currentDocNewLineCount: number = 0;
	const docs: IDictionary = {};

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('devmetrics.showData', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user

		let linesCount = getSummarizedMetrics(docs);

		const panel = vscode.window.createWebviewPanel(
			'devMetrics', // Identifies the type of the webview.
			'DevMetrics', // Title of the panel displayed to the user
			vscode.ViewColumn.One, // Editor column to show the new webview panel in.
			{} // Webview options.
		  );

		  panel.webview.html = getWebviewContent(linesCount);

		  const updateWebview = () => {

			panel.webview.html = getWebviewContent(getSummarizedMetrics(docs));
		  };
	
		  // Set initial content
		  updateWebview();
	
		  // And schedule updates to the content every second
		  setInterval(updateWebview, 1000);
	});

	// if (vscode.window.activeTextEditor?.document.fileName !== undefined && vscode.window.activeTextEditor?.document.lineCount !== undefined)
	// 	{
	// 		docs[vscode.window.activeTextEditor?.document.fileName as string] = vscode.window.activeTextEditor?.document.lineCount as number;
	// 	}

	vscode.window.onDidChangeActiveTextEditor(function(event) {
		if (event?.document.fileName !== undefined && vscode.window.activeTextEditor?.document.lineCount !== undefined)
		{
			docs[event?.document.fileName as string] = vscode.window.activeTextEditor?.document.lineCount as number;
		}
	});

	vscode.workspace.onDidSaveTextDocument(function(event) {
		currentDocNewLineCount = event.lineCount as number;
		docs[event.fileName as string] = event.lineCount as number;
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function getWebviewContent(linesCount: number) {
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>DevMetrics data</title>
  </head>
  <body>
	  <h1>Lines of code written during current session: ${linesCount}</h1>
  </body>
  </html>`;
  }
