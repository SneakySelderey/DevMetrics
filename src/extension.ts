// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { Console } from 'console';
import * as vscode from 'vscode';

interface IDictionary {
    [key: string]: number;
}

interface IDictionaryTextDoc {
    [key: string]: vscode.TextDocument;
}

interface IDictionaryArray {
    [key: string]: number[];
}

class Metrics
{
	docsPrevState: IDictionary = {}; // track initial state of docs
	docsObj: IDictionaryTextDoc = {}; // track current state of docs
	additionsCount: number = 0; // number of overall additions
	deletionsCount: number = 0; // number of overall deletions
	additionsByDocs: any[] = [['N/A', 0]]; // number of additions for each active doc
	deletionsByDocs: any[] = [['N/A', 0]]; // number of deletions for each active doc

	updateMetrics(): void
	/**
   * Updates metrics class for current session.
   * 
   * @param docsPrevState - (number[]) Amount of lines in active files before the changes
   * @param docsObj - (number[]) Amount of lines in active files after the changes
   * @returns void
	*/
{
	this.additionsCount = 0, this.deletionsCount = 0;
	this.additionsByDocs = [['N/A', 0]], this.deletionsByDocs = [['N/A', 0]];
	let delta = 0; // counter for delta between original doc and modified doc
	for (let key in this.docsPrevState)
	{
		delta = this.docsObj[key].lineCount - this.docsPrevState[key];
		if (delta > 0) // if the delta is positive, push the element to additions
		{
			this.additionsCount += delta;
			this.additionsByDocs.push([key, delta]);
		}
		else if (delta < 0) // if the delta is negative, push the element to deletions
		{
			this.deletionsCount -= delta;
			this.deletionsByDocs.push([key, -delta]);
		}
	}
	this.additionsByDocs.sort((a, b) => a[1] < b[1] ? -1 : 1);
	this.deletionsByDocs.sort((a, b) => a[1] > b[1] ? -1 : 1);

}
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "devmetrics" is now active!');

	const metrics = new Metrics(); // metrics class

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('devmetrics.showData', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user

		metrics.updateMetrics();

		const panel = vscode.window.createWebviewPanel(
			'devMetrics', // Identifies the type of the webview.
			'DevMetrics', // Title of the panel displayed to the user
			vscode.ViewColumn.One, // Editor column to show the new webview panel in.
			{
			} // Webview options.
		  );
		//create webview using metrics returned by getUpdatedMetrics()
		  panel.webview.html = getWebviewContent(metrics);
		// update webview every second
		  const updateWebview = () => {
			metrics.updateMetrics();
			panel.webview.html = getWebviewContent(metrics);
		  };
	
		  // Set initial content
		  updateWebview();
	
		  // And schedule updates to the content every second
		  setInterval(updateWebview, 1000);
	});

	// this block of code tracks the initial document if it was already opened on startup
	if (vscode.window.activeTextEditor?.document.fileName !== undefined 
		&& vscode.window.activeTextEditor?.document.lineCount !== undefined 
		&& vscode.window.activeTextEditor?.document.fileName in Object.keys(metrics.docsPrevState) === false)
		{
			metrics.docsPrevState[vscode.window.activeTextEditor?.document.fileName as string] = vscode.window.activeTextEditor?.document.lineCount as number;
			metrics.docsObj[vscode.window.activeTextEditor?.document.fileName as string] = vscode.window.activeTextEditor?.document;
		}

	// this block of code thacks all documents opened by users
	vscode.window.onDidChangeActiveTextEditor(function(event) {
		if (event?.document.fileName !== undefined 
			&& vscode.window.activeTextEditor?.document.lineCount !== undefined
			&& Object.keys(metrics.docsPrevState).includes(event?.document.fileName) === false)
		{
			metrics.docsPrevState[event?.document.fileName] = event.document.lineCount as number;
			metrics.docsObj[vscode.window.activeTextEditor?.document.fileName as string] = event.document;
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function getWebviewContent(metrics: Metrics)
/**
   * Returns HTML strucure for WebView to display.
   * 
   * @param x - (Metrics) Metric to display. Usually returned by getUpdatedMetrics().
   * @returns - HTML structure.
*/
{
	return `<!DOCTYPE html>
	<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>DevMetrics data</title>
		</head>
		<body>
			<h2>Coding statistics</h2>
			<ul>
			<li>
				<h3>Lines statistics</h3>
				<p style="color: green; font-size:16px;">Lines of code added during current session: ${metrics.additionsCount}</p>
				<p style="color: red; font-size:16px;">Lines of code deleted during current session: ${metrics.deletionsCount}</p>
			</li>
			<li>
				<h3>Files statistics</h3>
				<p style="color: green; font-size:16px;">Top file by additions: ${metrics.additionsByDocs[metrics.additionsByDocs.length - 1][0]} - ${metrics.additionsByDocs[metrics.additionsByDocs.length - 1][1]} additions</p>
				<p style="color: red; font-size:16px;">Top file by deletions: ${metrics.deletionsByDocs[0][0]} - ${metrics.deletionsByDocs[0][1]} deletions</p>
			</li>
			</ul>
		</body>
	</html>`;
  }
