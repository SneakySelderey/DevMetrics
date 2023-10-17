// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { Console } from 'console';
import * as vscode from 'vscode';

interface IDictionary {
    [key: string]: number;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "devmetrics" is now active!');

	let lineCountDelta: number = 0;
	let currentDocNewLineCount: number = 0;
	const docs: IDictionary = {};

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('devmetrics.showLines', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user

		lineCountDelta = 0;
		for (let key in docs)
		{
			console.log(key + " " + docs[key]);
			lineCountDelta += docs[key];
		}

		vscode.window.showInformationMessage('Total amount of lines written: ' + lineCountDelta);
	});

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
