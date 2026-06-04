import * as signalR from "@microsoft/signalr";
import { backendBaseUrl } from '@/config/env';

class SignalRService {
    private connection: signalR.HubConnection | null = null;

    // Инициализация и запуск подключения
    public async startConnection(): Promise<void> {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            return;
        }

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${backendBaseUrl}/crmConstructorHub`, {
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets,
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000]) // Интервалы переподключения при разрыве
            .configureLogging(signalR.LogLevel.Information)
            .build();

        try {
            await this.connection.start();
            console.log("🟢 SignalR: Подключение успешно установлено.");
        } catch (err) {
            console.error("🔴 SignalR: Ошибка при подключении:", err);
            setTimeout(() => this.startConnection(), 5000); // Повторная попытка через 5 секунд
        }
    }

    // Остановка подключения (например, при выходе из редактора)
    public async stopConnection(): Promise<void> {
        if (this.connection) {
            await this.connection.stop();
            console.log("🟡 SignalR: Подключение остановлено.");
        }
    }

    // =========================================================
    // МЕТОДЫ ОТПРАВКИ ДАННЫХ НА БЭКЕНД (Фронтенд -> Бэкенд)
    // =========================================================

    public isConnected(): boolean {
        return this.connection?.state === signalR.HubConnectionState.Connected;
    }

    // Отправка текущего состояния элемента (актуально при перемещении/изменении в реальном времени)
    public async sendElementState(elementId: string, jsonState: string): Promise<boolean> {
        if (!this.isConnected()) {
            console.warn("SignalR: sendElementState пропущен — нет подключения к хабу.");
            return false;
        }

        try {
            await this.connection!.invoke("AddOrUpdateStateAsync", elementId, jsonState);
            return true;
        } catch (err) {
            console.error("SignalR: Не удалось отправить состояние элемента:", err);
            return false;
        }
    }

    /** Сохранение позиции/размера в БД после отпускания мыши (drag/resize end). */
    public async saveElementPosition(
        elementId: string,
        pageId: string,
        jsonState: string
    ): Promise<boolean> {
        if (!this.isConnected()) {
            console.warn("SignalR: saveElementPosition пропущен — нет подключения к хабу.");
            return false;
        }

        try {
            await this.connection!.invoke(
                "SaveElementPositionAsync",
                elementId,
                pageId,
                jsonState
            );
            return true;
        } catch (err) {
            console.error("SignalR: Не удалось сохранить позицию элемента в БД:", err);
            return false;
        }
    }

    /** Актуальное состояние в памяти хаба + сохранение позиции (после drag end). */
    public async persistElement(elementId: string, pageId: string, jsonState: string): Promise<boolean> {
        const stateSent = await this.sendElementState(elementId, jsonState);
        if (!stateSent) {
            return false;
        }
        return this.saveElementPosition(elementId, pageId, jsonState);
    }

    public async createPage(pageId: string, name: string): Promise<void> {
        if (!this.isConnected()) {
            console.warn("SignalR: createPage пропущен — нет подключения к хабу.");
            return;
        }

        try {
            await this.connection!.invoke("CreatePageAsync", pageId, name);
        } catch (err) {
            console.error("SignalR: Не удалось уведомить о создании страницы:", err);
        }
    }

    public async renamePage(pageId: string, name: string): Promise<void> {
        if (!this.isConnected()) {
            console.warn("SignalR: renamePage пропущен — нет подключения к хабу.");
            return;
        }

        try {
            await this.connection!.invoke("RenamePageAsync", pageId, name);
        } catch (err) {
            console.error("SignalR: Не удалось уведомить о переименовании страницы:", err);
        }
    }

    public async deletePage(pageId: string): Promise<void> {
        if (!this.isConnected()) {
            console.warn("SignalR: deletePage пропущен — нет подключения к хабу.");
            return;
        }

        try {
            await this.connection!.invoke("DeletePageAsync", pageId);
        } catch (err) {
            console.error("SignalR: Не удалось уведомить об удалении страницы:", err);
        }
    }

    // Удаление элемента
    public async deleteElement(elementId: string): Promise<void> {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            try {
                await this.connection.invoke("DeleteElementAsync", elementId);
            } catch (err) {
                console.error("SignalR: Не удалось удалить элемент:", err);
            }
        }
    }

    // =========================================================
    // ПОДПИСКИ НА СОБЫТИЯ БЭКЕНДА (Бэкенд -> Фронтенд)
    // =========================================================

    public onReceiveNewState(callback: (elementId: string, json: string) => void): void {
        this.connection?.on("ReceiveNewState", callback);
    }

    public onDeleteElement(callback: (elementId: string) => void): void {
        this.connection?.on("DeleteElement", callback);
    }

    public onDeleteAll(callback: () => void): void {
        this.connection?.on("DeleteAll", callback);
    }

    public onCreatePage(callback: (pageId: string, name: string) => void): void {
        this.connection?.on("CreatePage", callback);
    }

    public onRenamePage(callback: (pageId: string, name: string) => void): void {
        this.connection?.on("RenamePage", callback);
    }

    public onDeletePage(callback: (pageId: string) => void): void {
        this.connection?.on("DeletePage", callback);
    }

    public onElementPositionUpdated(
        callback: (elementId: string, pageId: string, jsonState: string) => void
    ): void {
        this.connection?.on("ElementPositionUpdated", callback);
    }
}

export const signalrService = new SignalRService();