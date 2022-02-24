import { ViewContainerRef, Component, ElementRef, AfterViewInit, ViewChild, ComponentFactoryResolver, OnInit } from '@angular/core';
import * as OT from '@opentok/client';
import { SubscriberComponent } from '../subscriber/subscriber.component';
import { StateService } from '../stateService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.css']
})
export class VideoComponent implements AfterViewInit, OnInit {
  @ViewChild('publisherDiv', { static: false }) publisherDiv: ElementRef;
  @ViewChild('subscriberHost', { read: ViewContainerRef, static: true }) subscriberHost: ViewContainerRef;
  session: OT.Session;
  publisher: OT.Publisher;
  publishing;
  apiKey: string;
  token: string;
  sessionId: string;
  videoOff=false;
  audioOff = false;
  public elementRef: ElementRef;
  @ViewChild('screensharepreview', { static: false }) set controlElRef(elementRef: ElementRef) {
    this.elementRef = elementRef;
  }
  screenSharingPublisher: any;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private stateService: StateService,
    private router: Router
  ) { }
  ngOnInit(): void {
    if (!this.stateService.apiKey$ || !this.stateService.token$ || !this.stateService.sessionId$) {
      this.router.navigate(['/']);
    }
    this.apiKey = this.stateService.apiKey$;
    this.token = this.stateService.token$;
    this.sessionId = this.stateService.sessionId$;
  }

  publish() {
    this.session.publish(this.publisher, (err) => {
      if (err) {
        console.log(err)
      }
      else {
        this.publishing = true;
      }
    });
  }

  endCall()
  {
    this.session.disconnect();
    this.publisher.publishVideo(false);
    this.session.on("streamDestroyed", function (event) {
      event.preventDefault();
      const idx = this.streams.indexOf(event.stream);
      if (idx > -1) {
        this.streams.splice(idx, 1);
        this.changeDetectorRef.detectChanges();
      }
    });

  }

  offVideo() {
    this.publisher.publishVideo(false);
    this.videoOff = true;
  }

  videoOn() {
    this.publisher.publishVideo(true);
    this.videoOff = false;
  }

  offAudio() {
    this.publisher.publishAudio(false);
    this.audioOff = true;
  }

  audioOn() {
    this.publisher.publishAudio(true);
    this.audioOff = false;
  }

  onStreamCreated(stream) {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(SubscriberComponent);

    const viewContainerRef = this.subscriberHost;
    const componentRef = viewContainerRef.createComponent(componentFactory);
    (<SubscriberComponent>componentRef.instance).stream = stream;
    (<SubscriberComponent>componentRef.instance).session = this.session;
    (<SubscriberComponent>componentRef.instance).subscribe();
  }
  

  ngAfterViewInit(): void {    
    this.publisher = OT.initPublisher
      (
        this.publisherDiv.nativeElement, {
        height: "100%",
        width: "100%",
        insertMode: 'append'
      });
    this.session = OT.initSession(this.apiKey, this.sessionId);
    this.session.connect(this.token, (err) => {
      if (err) {
        console.log(err);
      }
      else {
        console.log("connected");
        this.publish()
        let that = this;
        this.session.on("streamCreated", function (event) {
          that.onStreamCreated(event.stream);
        });
      }
    })
  }

  screenShare()
  {
    var session = OT.initSession(this.stateService.apiKey$, this.stateService.sessionId$);
    var _this = this;
    OT.checkScreenSharingCapability(function (response) {
      if (!response.supported || response.extensionRegistered === false) {
       alert("This browser does not support screen sharing");
      } 
      else if (response.extensionInstalled === false) {
        alert("Your browser doesn't has Screen Sharing Extension");
      } else {
       OT.initPublisher(_this.elementRef.nativeElement, { insertMode: "append", width: '100%', height: '570', videoSource: 'screen' });
        _this.session.publish(_this.screenSharingPublisher, function (error) {
          if (error) {
          }
        });

      }
    });
  }

}
