import * as signalR from "@microsoft/signalr";
import { backendBaseUrl } from '@/config/env';

class SignalRService {
    private connection: signalR.HubConnection | null = null;

    public async startConnection(): Promise<void> {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            return;
        }

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${backendBaseUrl}/crmConstructorHub`, {
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets,
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000])
            .configureLogging(signalR.LogLevel.Information)
            .build();

        try {
            await this.connection.start();
            console.log("🟢 SignalR: Подключение успешно установлено.");
        } catch (err) {
            console.error("🔴 SignalR: Ошибка при подключении:", err);
            setTimeout(() => this.startConnection(), 5000);
        }
    }

    public clearEventHandlers(): void {
        if (!this.connection) {
            return;
        }
        const events = [
            'ReceiveNewState',
            'DeleteElement',
            'DeleteAll',
            'CreatePage',
            'RenamePage',
            'DeletePage',
            'ElementPositionUpdated',
        ] as const;
        for (const eventName of events) {
            this.connection.off(eventName);
        }
    }

    public async stopConnection(): Promise<void> {
        if (this.connection) {
            this.clearEventHandlers();
            await this.connection.stop();
            this.connection = null;
            console.log("🟡 SignalR: Подключение остановлено.");
        }
    }

    public isConnected(): boolean {
        return this.connection?.state === signalR.HubConnectionState.Connected;
    }

    public async ensureConnected(): Promise<boolean> {
        if (this.isConnected()) {
            return true;
        }
        await this.startConnection();
        return this.isConnected();
    }

    public async createElement(
        pageId: string,
        elementId: string,
        jsonState: string
    ): Promise<boolean> {
        if (!(await this.ensureConnected())) {
            console.warn('SignalR: createElement пропущен — нет подключения к хабу.');
            return false;
        }

        try {
            await this.connection!.invoke('CreateElementAsync', pageId, elementId, jsonState);
            return true;
        } catch (err) {
            console.error('SignalR: Не удалось создать элемент:', err);
            return false;
        }
    }

    public async updateElement(elementId: string, jsonState: string): Promise<boolean> {
        if (!(await this.ensureConnected())) {
            console.warn('SignalR: updateElement пропущен — нет подключения к хабу.');
            return false;
        }

        try {
            await this.connection!.invoke('UpdateElementAsync', elementId, jsonState);
            return true;
        } catch (err) {
            console.error('SignalR: Не удалось обновить элемент:', err);
            return false;
        }
    }

    /** Сохранение геометрии после drag/resize. */
    public async saveElementPosition(
        elementId: string,
        pageId: string,
        jsonState: string
    ): Promise<boolean> {
        if (!(await this.ensureConnected())) {
            console.warn('SignalR: saveElementPosition пропущен — нет подключения к хабу.');
            return false;
        }

        try {
            await this.connection!.invoke(
                'SaveElementPositionAsync',
                elementId,
                pageId,
                jsonState
            );
            return true;
        } catch (err) {
            console.error('SignalR: Не удалось сохранить позицию элемента:', err);
            return false;
        }
    }

    public async createPage(pageId: string, name: string): Promise<void> {
        if (!(await this.ensureConnected())) {
            return;
        }

        try {
            await this.connection!.invoke('CreatePageAsync', pageId, name);
        } catch (err) {
            console.error('SignalR: Не удалось уведомить о создании страницы:', err);
        }
    }

    public async renamePage(pageId: string, name: string): Promise<void> {
        if (!(await this.ensureConnected())) {
            return;
        }

        try {
            await this.connection!.invoke('RenamePageAsync', pageId, name);
        } catch (err) {
            console.error('SignalR: Не удалось уведомить о переименовании страницы:', err);
        }
    }

    public async deletePage(pageId: string): Promise<void> {
        if (!(await this.ensureConnected())) {
            return;
        }

        try {
            await this.connection!.invoke('DeletePageAsync', pageId);
        } catch (err) {
            console.error('SignalR: Не удалось уведомить об удалении страницы:', err);
        }
    }

    public async deleteElement(elementId: string): Promise<boolean> {
        if (!(await this.ensureConnected())) {
            console.warn('SignalR: deleteElement пропущен — нет подключения к хабу.');
            return false;
        }

        try {
            await this.connection!.invoke('DeleteElementAsync', elementId);
            return true;
        } catch (err) {
            console.error('SignalR: Не удалось удалить элемент:', err);
            return false;
        }
    }

    private subscribe<T extends (...args: never[]) => void>(eventName: string, callback: T): void {
        this.connection?.off(eventName);
        this.connection?.on(eventName, callback);
    }

    public onReceiveNewState(callback: (elementId: string, json: string) => void): void {
        this.subscribe('ReceiveNewState', callback);
    }

    public onDeleteElement(callback: (elementId: string) => void): void {
        this.subscribe('DeleteElement', callback);
    }

    public onDeleteAll(callback: () => void): void {
        this.subscribe('DeleteAll', callback);
    }

    public onCreatePage(callback: (pageId: string, name: string) => void): void {
        this.subscribe('CreatePage', callback);
    }

    public onRenamePage(callback: (pageId: string, name: string) => void): void {
        this.subscribe('RenamePage', callback);
    }

    public onDeletePage(callback: (pageId: string) => void): void {
        this.subscribe('DeletePage', callback);
    }

    public onElementPositionUpdated(
        callback: (elementId: string, pageId: string, jsonState: string) => void
    ): void {
        this.subscribe('ElementPositionUpdated', callback);
    }
}

export const signalrService = new SignalRService();
